import { useState } from 'react';
import { apiFetch } from '../services/api';

export function RecoveryView({ token, onBack }: { token?: string; onBack:()=>void }) {
  const [value,setValue]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  return <section className="welcome-account max-w-md mx-auto my-10"><h2>{token?'Kata laluan baharu':'Lupa kata laluan?'}</h2><p>{token?'Pilih kata laluan 8–256 aksara.':'Kami akan menghantar pautan pemulihan ke e-mel akaun anda.'}</p>
    {!done&&<form onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{const res=await apiFetch(`/api/auth/${token?'reset-password':'forgot-password'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(token?{token,password:value}:{email:value})});const data=await res.json();setMessage(data.message||data.error);if(res.ok)setDone(true);}catch{setMessage('Ralat sambungan. Sila cuba lagi.');}finally{setBusy(false);}}}>
      <label htmlFor="recovery-value">{token?'Kata laluan baharu':'Alamat e-mel'}</label><input id="recovery-value" className="w-full border rounded-xl p-3 my-3" type={token?'password':'email'} autoComplete={token?'new-password':'email'} required minLength={token?8:undefined} maxLength={token?256:254} value={value} onChange={e=>setValue(e.target.value)}/>
      <button disabled={busy} className="practice-start text-white rounded-xl p-3 w-full">{busy?'Sila tunggu…':token?'Simpan kata laluan':'Hantar pautan'}</button>
    </form>}
    {message&&<p role="status">{message}</p>}<button className="mt-5 underline" onClick={onBack}>Kembali ke log masuk</button>
  </section>;
}
