import React, { useState } from 'react';
import {
  X,
  Award,
  BookOpen,
  Mic,
  Headphones,
  CheckCircle2,
  Sparkles,
  FileText,
  HelpCircle
} from 'lucide-react';

interface RubricGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RubricGuideModal: React.FC<RubricGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'bertutur' | 'mendengar' | 'tips'>('bertutur');

  if (!isOpen) return null;

  return (
    <div
      id="rubric-guide-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="rubric-guide-modal-content"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-serif text-white">
                Format Pentaksiran & Kriteria LPM SPM
              </h3>
              <p className="text-xs text-slate-400">
                Panduan Rasmi Lembaga Peperiksaan Malaysia &bull; Kod 1103/3 & 1103/4
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="bg-slate-100 px-5 py-2 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('bertutur')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bertutur'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-600" />
            Ujian Bertutur (1103/3)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mendengar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mendengar'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-teal-600" />
            Ujian Mendengar (1103/4)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tips')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tips'
                ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Tip Skor A+ LPM
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm leading-relaxed">
          {activeTab === 'bertutur' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                  Struktur Ujian Bertutur SPM (Jumlah: 40 Markah)
                </span>
                <p className="text-slate-700">
                  Ujian bertutur terbahagi kepada dua bahagian utama yang dinilai secara holistik dan analitik:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-950 text-xs">Bahagian A: Taksiran Individu</span>
                    <p className="text-slate-600 text-[11px]">
                      Calon diberikan satu bahan rangsangan (petikan teks / grafik / situasi). Masa persediaan 1 minit dan masa bertutur 3 hingga 5 minit.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-950 text-xs">Bahagian B: Taksiran Kumpulan</span>
                    <p className="text-slate-600 text-[11px]">
                      Perbincangan 4 hingga 5 orang calon berdasarkan satu isu umum. Masa persediaan 3 minit dan perbincangan 12 hingga 15 minit.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Rubric Criteria Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-3">Kriteria Penilaian</th>
                      <th className="p-3">Markah</th>
                      <th className="p-3">Huraian Aras Cemerlang LPM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-3 font-bold text-emerald-900">1. Tatabahasa & Kosa Kata</td>
                      <td className="p-3 font-mono font-bold text-center">10m</td>
                      <td className="p-3 text-slate-600">
                        Menggunakan pelbagai struktur ayat majmuk yang gramatis, laras bahasa formal yang betul, dan kosa kata luas/aras tinggi.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-teal-900">2. Sebutan & Intonasi</td>
                      <td className="p-3 font-mono font-bold text-center">10m</td>
                      <td className="p-3 text-slate-600">
                        Sebutan baku sangat jelas, tepat, dan intonasi bersahaja serta tidak dipengaruhi oleh dialek daerah.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-indigo-900">3. Kefasihan & Kelancaran</td>
                      <td className="p-3 font-mono font-bold text-center">10m</td>
                      <td className="p-3 text-slate-600">
                        Pengucapan petah, lancar tanpa tersekat-sekat, dan penggunaan jeda yang sangat berkesan pada klausa ayat.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-900">4. Pengolahan Idea</td>
                      <td className="p-3 font-mono font-bold text-center">10m</td>
                      <td className="p-3 text-slate-600">
                        Idea matang, bernas, berkembang dengan contoh-contoh relevan dan huraian yang tersusun rapi mengikut formula IMBaCK.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'mendengar' && (
            <div className="space-y-4">
              <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-900 block">
                  Struktur Ujian Mendengar SPM (Jumlah: 30 Markah &bull; 30 Minit)
                </span>
                <p className="text-slate-700">
                  Ujian mendengar menguji keupayaan memahami, mentafsir, dan memproses maklumat lisan daripada pelbagai genre audio:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs pl-2">
                  <li><strong>Genre Rakaman:</strong> Berita, Pengumuman, Wawancara/Temu Ramah, Taklimat, Ceramah, Iklan, dan Perbualan Telefon.</li>
                  <li><strong>Bentuk Soalan:</strong> Objektif Aneka Pilihan (MCQ), Betul/Salah, Padanan, dan Isi Tempat Kosong Frasa/Kata Kunci.</li>
                  <li><strong>Pusingan Audio:</strong> Setiap petikan akan dimainkan sebanyak dua kali dengan selang masa menjawab 1 hingga 2 minit.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Formula Rahsia Skor A+ Ujian Bertutur SPM (Formula IMBaCK)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-150">
                    <strong className="text-emerald-800">I - Isi Utama:</strong> Nyatakan hujah teras dengan penanda wacana (Cth: <em>"Sebagai pembuka tirai bicara..."</em>)
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-150">
                    <strong className="text-emerald-800">M - Mengapa:</strong> Jelaskan punca atau faktor penyebab secara logik.
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-150">
                    <strong className="text-emerald-800">Ba - Bagaimana:</strong> Huraikan langkah atau mekanisme pelaksanaan.
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-150">
                    <strong className="text-emerald-800">C - Contoh:</strong> Kemukakan statistik, nama program atau peristiwa semasa.
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-150 sm:col-span-2">
                    <strong className="text-emerald-800">K - Kesan / Kesimpulan:</strong> Kaitkan impak dengan wawasan negara dan selitkan peribahasa SPM.
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">Penanda Wacana Aras Tinggi Wajib Kuasai:</span>
                <p className="leading-relaxed">
                  <em>Tuntasnya, Seyogianya, Lebih-lebih lagi, Bertitik tolak daripada itu, Sementelahan pula, Kendatipun begitu, Rentetan daripada senario itu.</em>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Kementerian Pendidikan Malaysia &bull; KSSM SPM</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Faham & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
