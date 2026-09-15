import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { account, digest, route } from './accounts.js';
import { hashPassword } from './security.js';
import type { Database } from './database.js';

export type ResetMailer = (email: string, link: string) => Promise<void>;
export function configuredMailer(): ResetMailer | null {
  if (!process.env.SMTP_URL || !process.env.MAIL_FROM || !process.env.APP_URL) return null;
  const transporter=nodemailer.createTransport(process.env.SMTP_URL, { from: process.env.MAIL_FROM });
  return async (to,link)=>{await transporter.sendMail({to,subject:'Tetapkan semula kata laluan Bual',text:`Buka pautan ini untuk menetapkan semula kata laluan anda. Pautan sah selama 30 minit dan hanya boleh digunakan sekali.\n\n${link}\n\nJika anda tidak meminta perubahan ini, abaikan e-mel ini.`});};
}
export function recoveryRoutes(db: Database, mailer: ResetMailer | null = configuredMailer()) {
  const router=Router();
  router.post('/auth/forgot-password',route(async(req,res)=>{
    if(!mailer)return res.status(503).json({error:'Pemulihan e-mel belum tersedia. Sila hubungi sokongan.'});
    if(typeof req.body.email!=='string'||req.body.email.length>254)return res.status(400).json({error:'E-mel tidak sah.'});
    const origin=new URL(process.env.APP_URL!);
    if(origin.protocol!=='https:' && !['localhost','127.0.0.1'].includes(origin.hostname))throw new Error('Recovery requires an HTTPS APP_URL');
    const row=(await db.query('SELECT id,email FROM accounts WHERE email=$1',[req.body.email.trim().toLowerCase()])).rows[0];
    if(row){
      const token=randomBytes(32).toString('hex');
      await db.query("INSERT INTO reset_tokens VALUES($1,$2,now()+interval '30 minutes')",[digest(token),row.id]);
      const link=new URL(origin);link.searchParams.set('reset',token);
      try{await mailer(row.email,link.toString());}catch{await db.query('DELETE FROM reset_tokens WHERE token_hash=$1',[digest(token)]);console.error('Password reset delivery failed');}
    }
    // Same response for unknown accounts and delivery failures; no identity disclosure.
    res.status(202).json({success:true,message:'Jika akaun wujud, pautan pemulihan akan dihantar melalui e-mel.'});
  }));
  router.post('/auth/reset-password',route(async(req,res)=>{
    const {token,password}=req.body;
    if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||typeof password!=='string'||password.length<8||password.length>256)return res.status(400).json({error:'Pautan atau kata laluan tidak sah.'});
    const salt=randomBytes(16).toString('hex'), passwordHash=await hashPassword(password,salt);
    const success=await db.transaction(async tx=>{
      const reset=(await tx.query('SELECT * FROM reset_tokens WHERE token_hash=$1 AND expires_at>now()',[digest(token)])).rows[0];
      if(!reset)return false;
      await account(tx,reset.user_id,true);
      const consumed=(await tx.query('DELETE FROM reset_tokens WHERE token_hash=$1 AND expires_at>now() RETURNING user_id',[digest(token)])).rows[0];
      if(!consumed)return false;
      await tx.query("UPDATE accounts SET password_hash=$1,salt=$2,profile=profile || '{\"authProvider\":\"email\"}'::jsonb WHERE id=$3",[passwordHash,salt,reset.user_id]);
      await tx.query('DELETE FROM sessions WHERE user_id=$1',[reset.user_id]);
      await tx.query('DELETE FROM reset_tokens WHERE user_id=$1',[reset.user_id]);
      return true;
    });
    if(!success)return res.status(400).json({error:'Pautan telah tamat atau digunakan. Minta pautan baharu.'});
    res.json({success:true,message:'Kata laluan dikemas kini. Sila log masuk semula.'});
  }));
  return router;
}
