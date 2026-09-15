import { Router, type RequestHandler } from 'express';
import type { Database } from './database.js';
import { account, progress, route, digest, malaysiaDay } from './accounts.js';
import { SPM_LISTENING_TRACKS } from '../src/data/spmListeningTracks.js';
import { isListeningAnswerCorrect } from '../src/utils/listeningGrading.js';
import { calculateSpmGrade } from '../src/utils/spmGrading.js';

export async function cachedAttempt(db: Database, userId: string, id: string) {
  return (await db.query('SELECT result FROM attempts WHERE user_id=$1 AND id=$2',[userId,id])).rows[0]?.result;
}
export async function recordAttempt(db: Database, userId: string, id: string, kind: string, topic: string, inputHash: string, result: any, points: number) {
  return db.transaction(async tx => {
    const row=await account(tx,userId,true);
    const existing=(await tx.query('SELECT result,input_hash FROM attempts WHERE user_id=$1 AND id=$2',[userId,id])).rows[0];
    if(existing){if(existing.input_hash!==inputHash)throw Object.assign(new Error('ID percubaan telah digunakan.'),{status:409});return {...existing.result,awarded:0,progress:progress(row)};}
    const rewardKey=`${kind}:${topic}:${malaysiaDay()}`;
    const reward=await tx.query('INSERT INTO rewards(user_id,reward_key,points) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING points',[userId,rewardKey,points]);
    const awarded=reward.rows[0]?.points||0;
    const grade=calculateSpmGrade(result.totalScore,result.maxScore);
    const updated=(await tx.query(`UPDATE accounts SET points=points+$1,last_grade=$2,speaking_done=speaking_done+$3,listening_done=listening_done+$4 WHERE id=$5 RETURNING *`,[awarded,JSON.stringify(grade),kind==='speaking'?1:0,kind==='listening'?1:0,userId])).rows[0];
    await tx.query('INSERT INTO attempts(id,user_id,kind,topic,input_hash,result,awarded) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,userId,kind,topic,inputHash,JSON.stringify(result),awarded]);
    return {...result,awarded,progress:progress(updated)};
  });
}

export function listeningRoutes(db: Database, auth: RequestHandler) {
  const router=Router();
  router.post('/attempts/listening',auth,route(async(req,res)=>{
    const {attemptId,trackId,answers}=req.body;
    const track=SPM_LISTENING_TRACKS.find(t=>t.id===trackId);
    if(!track||typeof attemptId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(attemptId)||!answers||typeof answers!=='object'||Array.isArray(answers))return res.status(400).json({error:'Jawapan tidak sah.'});
    const normalized:Record<string,unknown>={};
    for(const q of track.questions){const a=answers[q.id];if(a!==undefined&&typeof a!=='boolean'&&typeof a!=='string')return res.status(400).json({error:'Jawapan tidak sah.'});if(typeof a==='string'&&a.length>500)return res.status(400).json({error:'Jawapan terlalu panjang.'});normalized[q.id]=a??null;}
    const correct=track.questions.filter(q=>isListeningAnswerCorrect(normalized[q.id],q)).length;
    const result={totalScore:Math.round(correct/track.questions.length*30),maxScore:30,correctCount:correct,totalQuestions:track.questions.length};
    res.json(await recordAttempt(db,res.locals.userId,attemptId,'listening',track.id,digest(JSON.stringify([trackId,normalized])),result,15+correct*10));
  }));
  return router;
}
