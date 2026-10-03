import { useState } from 'react';
import { getSpeakingModelAnswer } from '../data/spmModelAnswers';
export function SpeakingReview({ topicId, title, answer, onBack, onRestart }: { topicId: string; title: string; answer: string; onBack: () => void; onRestart: () => void }) {
  const [checks, setChecks] = useState<string[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const items = ['Saya menjawab soalan yang ditanya.', 'Saya memberikan isi, huraian dan contoh.', 'Saya menyusun pendahuluan dan penutup.', 'Saya menyemak sebutan dan kelancaran dengan membaca semula.'];
  const exportText = `${title}\n\nJawapan saya:\n${answer}\n\nSemakan kendiri:\n${items.map(item => `${checks.includes(item) ? '[x]' : '[ ]'} ${item}`).join('\n')}\n\nLatihan kendiri — bukan penilaian AI atau gred rasmi.`;
  async function copyText() {
    setShowExport(true);
    setCopyMessage('');
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyMessage('Teks latihan telah disalin. Tampal ke aplikasi nota anda.');
    } catch {
      setCopyMessage('Salinan automatik tidak dibenarkan. Pilih teks di bawah dan salin secara manual.');
    }
  }
  function download() {
    let url: string | undefined;
    const link = document.createElement('a');
    try {
      url = URL.createObjectURL(new Blob([exportText], { type: 'text/plain;charset=utf-8' }));
      link.href = url;
      link.download = 'bual-latihan-bertutur.txt';
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      // A click does not confirm that an embedded browser saved the file.
      setDownloadMessage('Jika fail tidak muncul dalam muat turun pelayar, gunakan teks di bawah untuk menyimpan latihan anda.');
    } catch {
      setDownloadMessage('Pelayar ini tidak dapat memulakan muat turun. Anda masih boleh menyalin teks latihan di bawah.');
    } finally {
      link.remove();
      if (url) { const pendingUrl = url; setTimeout(() => URL.revokeObjectURL(pendingUrl), 30000); }
      setShowExport(true);
    }
  }
  return <section className="bg-white rounded-3xl border border-stone-200 p-5 space-y-5">
    <div><p className="text-xs uppercase tracking-widest text-[#913b54]">Latihan selesai</p><h2 className="text-2xl font-bold mt-2">Semak, baiki, cuba lagi.</h2><p className="text-sm mt-2 text-stone-600">Semakan kendiri tanpa AI. Tiada markah atau XP diberikan; senarai ini membantu anda membuat refleksi.</p></div>
    <div><h3 className="font-bold">Jawapan saya</h3><p className="whitespace-pre-wrap mt-2 text-sm">{answer}</p></div>
    <fieldset className="space-y-3"><legend className="font-bold mb-3">Senarai semak saya</legend>{items.map(item => <label className="flex gap-3 text-sm" key={item}><input type="checkbox" checked={checks.includes(item)} onChange={event => setChecks(old => event.target.checked ? [...old, item] : old.filter(value => value !== item))}/>{item}</label>)}</fieldset>
    <details className="border-t pt-4"><summary className="cursor-pointer font-bold">Lihat contoh jawapan</summary><p className="text-xs text-stone-500 my-2">Contoh untuk pembelajaran, bukan skema rasmi. Sesuaikan dengan idea anda sendiri.</p><p className="whitespace-pre-wrap text-sm leading-relaxed">{getSpeakingModelAnswer(topicId, title)}</p></details>
    <div className="flex flex-wrap gap-3"><button className="practice-start text-white p-3 rounded-xl" onClick={download}>Muat turun latihan</button><button className="underline p-2" aria-expanded={showExport} aria-controls="speaking-export" onClick={() => setShowExport(value => !value)}>Teks untuk disalin</button><button className="underline p-2" onClick={onBack}>Baiki jawapan</button><button className="underline p-2" onClick={onRestart}>Latihan baharu</button></div>
    {downloadMessage && <p role="status" className="text-sm text-stone-600">{downloadMessage}</p>}
    {showExport && <div id="speaking-export" className="space-y-2">
      <label htmlFor="speaking-export-text" className="block font-bold text-sm">Teks latihan lengkap</label>
      <button className="underline p-2 text-sm" onClick={copyText}>Salin teks latihan</button>
      {copyMessage && <p role="status" className="text-sm text-stone-600">{copyMessage}</p>}
      <p id="speaking-export-help" className="text-sm text-stone-600">Pilih teks, salin dan tampal ke aplikasi nota anda. Jawapan dan senarai semak disertakan.</p>
      <textarea id="speaking-export-text" aria-describedby="speaking-export-help" readOnly value={exportText} onFocus={event => event.currentTarget.select()} rows={10} className="w-full rounded-xl border border-stone-300 p-3 text-sm" />
    </div>}
  </section>;
}
