import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

export function SubscriptionStatus(){
  const [status,setStatus]=useState<{premium:boolean;checkoutAvailable:boolean}|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{void apiFetch('/api/billing/status').then(async r=>{if(r.ok)setStatus(await r.json());}).catch(()=>{});},[]);
  const [usage,setUsage]=useState<{features:Record<string,{remaining:number;limit:number}>}|null>(null);
  useEffect(()=>{
    const refresh=()=>{void apiFetch('/api/usage').then(async r=>{if(r.ok)setUsage(await r.json());}).catch(()=>{});};
    refresh();window.addEventListener('ai-usage-changed',refresh);window.addEventListener('focus',refresh);
    return ()=>{window.removeEventListener('ai-usage-changed',refresh);window.removeEventListener('focus',refresh);};
  },[]);
  if(!status)return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 mb-5 text-sm"><span>{status.premium?'Bual Plus aktif':'Pelan latihan asas'}</span>{usage&&<span className="text-xs text-stone-600" aria-label="Baki penggunaan AI hari ini">Baki hari ini: Bertutur {usage.features.speaking.remaining}/{usage.features.speaking.limit} · Cikgu AI {usage.features.chat.remaining}/{usage.features.chat.limit}<span className="block">Dikemas kini setiap hari, waktu Malaysia. Fungsi AI tertakluk pada ketersediaan.</span></span>}{status.checkoutAvailable&&<button disabled={busy} className="text-[#913b54] font-bold underline" onClick={async()=>{setBusy(true);try{const res=await apiFetch(`/api/billing/${status.premium?'portal':'checkout'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const data=await res.json();if(!res.ok)throw new Error(data.error);const url=new URL(data.url);if(url.protocol!=='https:'||!['checkout.stripe.com','billing.stripe.com'].includes(url.hostname))throw new Error('Pautan pembayaran tidak sah.');window.location.assign(url.href);}catch(e){setError(e instanceof Error?e.message:'Sila cuba lagi.');setBusy(false);}}}>{busy?'Sila tunggu…':status.premium?'Urus langganan':'Lihat pelan Plus'}</button>}{error&&<p role="alert">{error}</p>}</div>;
}
