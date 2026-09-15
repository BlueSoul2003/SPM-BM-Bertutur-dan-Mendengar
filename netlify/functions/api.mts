import type { Config, Context } from '@netlify/functions';
import serverless from 'serverless-http';
import { createApplication } from '../../server/app.js';

let initialized: Promise<ReturnType<typeof serverless>> | undefined;
function handler(databaseUrl: string) {
  if (!initialized) initialized=createApplication({serverless:true,databaseUrl})
    .then(app=>serverless(app,{binary:['audio/mpeg']}))
    .catch(error=>{initialized=undefined;throw error;});
  return initialized;
}
export default async (request: Request, context: Context) => {
  try {
    const url=new URL(request.url);
    const databaseUrl=Netlify.env.get('DATABASE_URL');
    if(!databaseUrl)throw new Error('DATABASE_URL is required');
    const run=await handler(databaseUrl);
    const result:any=await run({version:'2.0',rawPath:url.pathname,rawQueryString:url.search.slice(1),headers:Object.fromEntries(request.headers),
      requestContext:{http:{method:request.method,sourceIp:context.ip || '127.0.0.1'}},
      body:Buffer.from(await request.arrayBuffer()).toString('base64'),isBase64Encoded:true},{});
    const headers=new Headers(result.headers);
    for(const cookie of result.cookies || [])headers.append('set-cookie',cookie);
    return new Response(result.isBase64Encoded?Buffer.from(result.body,'base64'):result.body,{status:result.statusCode,headers});
  } catch {
    console.error('API initialization or request failed');
    return Response.json({error:'Pelayan sedang bersedia. Sila cuba lagi sebentar.'},{status:503});
  }
};
export const config: Config = { path:'/api/*' };
