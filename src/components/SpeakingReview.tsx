import { useState } from 'react';
import { getSpeakingModelAnswer } from '../data/spmModelAnswers';
export function SpeakingReview({ topicId, title, answer, onBack, onRestart }: { topicId: string; title: string; answer: string; onBack: () => void; onRestart: () => void }) {
  const [checks, setChecks] = useState<string[]>([]);
  const items = ['Saya menjawab soalan yang ditanya.', 'Saya memberikan isi, huraian dan contoh.', 'Saya menyusun pendahuluan dan penutup.', 'Saya menyemak sebutan dan kelancaran dengan membaca semula.'];
  function download() {
    const blob = new Blob([`${title}\n\nJawapan saya:\n${answer}\n\nSemakan kendiri:\n${items.map(item => `${checks.includes(item) ? '[x]' : '[ ]'} ${item}`).join('\n')}\n\nLatihan kendiri — bukan penilaian AI atau gred rasmi.`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'bual-latihan-bertutur.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="bg-white rounded-3xl border border-stone-200 p-5 space-y-5">
    <div><p className="text-xs uppercase tracking-widest text-[#913b54]">Latihan selesai</p><h2 className="text-2xl font-bold mt-2">Semak, baiki, cuba lagi.</h2><p className="text-sm mt-2 text-stone-600">Semakan kendiri tanpa AI. Tiada markah atau XP diberikan; senarai ini membantu anda membuat refleksi.</p></div>
    <div><h3 className="font-bold">Jawapan saya</h3><p className="whitespace-pre-wrap mt-2 text-sm">{answer}</p></div>
    <fieldset className="space-y-3"><legend className="font-bold mb-3">Senarai semak saya</legend>{items.map(item => <label className="flex gap-3 text-sm" key={item}><input type="checkbox" checked={checks.includes(item)} onChange={event => setChecks(old => event.target.checked ? [...old, item] : old.filter(value => value !== item))}/>{item}</label>)}</fieldset>
    <details className="border-t pt-4"><summary className="cursor-pointer font-bold">Lihat contoh jawapan</summary><p className="text-xs text-stone-500 my-2">Contoh untuk pembelajaran, bukan skema rasmi. Sesuaikan dengan idea anda sendiri.</p><p className="whitespace-pre-wrap text-sm leading-relaxed">{getSpeakingModelAnswer(topicId, title)}</p></details>
    <div className="flex flex-wrap gap-3"><button className="practice-start text-white p-3 rounded-xl" onClick={download}>Muat turun latihan</button><button className="underline p-2" onClick={onBack}>Baiki jawapan</button><button className="underline p-2" onClick={onRestart}>Latihan baharu</button></div>
  </section>;
}
