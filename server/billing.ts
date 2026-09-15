import express, { Router, type RequestHandler } from 'express';
import Stripe from 'stripe';
import type { Database } from './database.js';
import { account, route, malaysiaDay, digest } from './accounts.js';

export async function premium(db: Database,userId: string) {
  return Boolean((await db.query('SELECT 1 FROM entitlements WHERE user_id=$1 AND valid_until>now()',[userId])).rows.length);
}
export function aiQuota(db: Database): RequestHandler {
  return route(async(req,res,next)=>{
    const isPremium=await premium(db,res.locals.userId);
    const limit=Number(process.env[isPremium?'PREMIUM_AI_DAILY_LIMIT':'FREE_AI_DAILY_LIMIT']|| (isPremium?100:10));
    if(!Number.isSafeInteger(limit)||limit<0)throw new Error('Invalid AI quota configuration');
    const key=`quota:${res.locals.userId}:${malaysiaDay()}`;
    const hits=(await db.query(`INSERT INTO rate_buckets VALUES($1,1,now()+interval '2 days') ON CONFLICT(bucket) DO UPDATE SET hits=rate_buckets.hits+1 RETURNING hits`,[key])).rows[0].hits;
    if(hits>limit)return res.status(429).json({error:'Had penggunaan AI harian telah dicapai. Sila cuba lagi esok.',code:'DAILY_QUOTA_EXCEEDED'});
    next();
  });
}

/** Current subscription is retrieved under an account lock; delayed events cannot restore stale access. */
export async function applySubscriptionEvent(db: Database, event: Stripe.Event, stripe: Stripe) {
  const object:any=event.data.object;
  const subscriptionId=event.type.startsWith('customer.subscription.')?object.id:
    object.parent?.subscription_details?.subscription || object.subscription;
  if(typeof subscriptionId!=='string')return;
  const initial:any=await stripe.subscriptions.retrieve(subscriptionId);
  const userId=initial.metadata?.userId;
  if(typeof userId!=='string')return;
  await db.transaction(async tx=>{
    const user=await account(tx,userId,true);if(!user)return;
    if((await tx.query('SELECT 1 FROM payment_events WHERE id=$1',[event.id])).rows.length)return;
    // Fetch after acquiring the lock, avoiding concurrent event arrival order races.
    const sub:any=await stripe.subscriptions.retrieve(subscriptionId);
    const price=process.env.STRIPE_PRICE_ID;
    const matching=sub.items?.data?.filter((item:any)=>item.price?.id===price)||[];
    const end=Math.min(...matching.map((item:any)=>item.current_period_end||sub.current_period_end||0));
    const allowed=sub.status==='active' && matching.length>0 && Number.isFinite(end) && end*1000>Date.now();
    if(allowed){
      await tx.query(`INSERT INTO entitlements(user_id,provider,subscription_id,valid_until) VALUES($1,'stripe',$2,to_timestamp($3))
        ON CONFLICT(user_id) DO UPDATE SET subscription_id=EXCLUDED.subscription_id,provider='stripe',valid_until=EXCLUDED.valid_until,updated_at=now()`,[userId,subscriptionId,end]);
    }else{
      // A canceled old subscription must not revoke a newer subscription on the same account.
      await tx.query('DELETE FROM entitlements WHERE user_id=$1 AND subscription_id=$2',[userId,subscriptionId]);
    }
    await tx.query('INSERT INTO payment_events(id) VALUES($1)',[event.id]);
  });
}
export function billingRoutes(db: Database,auth: RequestHandler,client?: Stripe) {
  const stripe=client || (process.env.STRIPE_SECRET_KEY?new Stripe(process.env.STRIPE_SECRET_KEY,{timeout:8000,maxNetworkRetries:1}):null);
  const router=Router(), webhook=Router();
  webhook.post('/billing/webhook',express.raw({type:'application/json',limit:'256kb'}),route(async(req,res)=>{
    if(!stripe||!process.env.STRIPE_WEBHOOK_SECRET)return res.status(503).json({error:'Billing not configured'});
    let event:Stripe.Event;
    try{event=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'] as string,process.env.STRIPE_WEBHOOK_SECRET);}catch{return res.status(400).json({error:'Invalid signature'});}
    const events=['customer.subscription.updated','customer.subscription.deleted','customer.subscription.created','invoice.paid','invoice.payment_failed'];
    if(events.includes(event.type))await applySubscriptionEvent(db,event,stripe);
    res.json({received:true});
  }));
  router.get('/billing/status',auth,route(async(_req,res)=>res.json({premium:await premium(db,res.locals.userId),checkoutAvailable:Boolean(stripe&&process.env.STRIPE_PRICE_ID&&process.env.APP_URL)})));
  router.post('/billing/portal',auth,route(async(_req,res)=>{
    if(!stripe||!process.env.APP_URL)return res.status(503).json({error:'Langganan belum tersedia.'});
    const entry=(await db.query('SELECT subscription_id FROM entitlements WHERE user_id=$1',[res.locals.userId])).rows[0];
    if(!entry)return res.status(404).json({error:'Langganan tidak dijumpai.'});
    const sub=await stripe.subscriptions.retrieve(entry.subscription_id);
    const customer=typeof sub.customer==='string'?sub.customer:sub.customer.id;
    const portal=await stripe.billingPortal.sessions.create({customer,return_url:process.env.APP_URL});
    res.json({url:portal.url});
  }));
  router.post('/billing/checkout',auth,route(async(req,res)=>{
    if(!stripe||!process.env.STRIPE_PRICE_ID||!process.env.APP_URL)return res.status(503).json({error:'Langganan belum tersedia.'});
    const url=new URL(process.env.APP_URL);
    if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Checkout requires HTTPS APP_URL');
    if(await premium(db,res.locals.userId))return res.status(409).json({error:'Langganan anda sudah aktif.'});
    const user=await account(db,res.locals.userId);
    // Price, account identity and redirects come only from the server.
    const session=await stripe.checkout.sessions.create({mode:'subscription',line_items:[{price:process.env.STRIPE_PRICE_ID,quantity:1}],customer_email:user.email,
      client_reference_id:user.id,subscription_data:{metadata:{userId:user.id}},success_url:new URL('/?billing=success',url).toString(),cancel_url:new URL('/?billing=cancel',url).toString()},
      {idempotencyKey:`checkout:${digest(user.id)}:${Math.floor(Date.now()/1800_000)}`});
    res.json({url:session.url});
  }));
  return {router,webhook};
}
