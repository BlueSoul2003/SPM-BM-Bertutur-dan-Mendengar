import { SpmGradeInfo } from '../types';

export const SPM_GRADE_THRESHOLDS = [
  { minPercent: 85, grade: 'A+' as const, title: 'Cemerlang Tertinggi', band: 'TP6 (Sangat Cemerlang & Fasih)', color: 'text-amber-500 bg-amber-50 border-amber-300' },
  { minPercent: 80, grade: 'A' as const, title: 'Cemerlang', band: 'TP5 (Cemerlang & Matang)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  { minPercent: 75, grade: 'A-' as const, title: 'Cemerlang', band: 'TP5 (Cemerlang)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { minPercent: 70, grade: 'B+' as const, title: 'Kepujian Tertinggi', band: 'TP4 (Kepujian Tinggi)', color: 'text-teal-700 bg-teal-50 border-teal-300' },
  { minPercent: 65, grade: 'B' as const, title: 'Kepujian Tinggi', band: 'TP4 (Kepujian)', color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { minPercent: 60, grade: 'C+' as const, title: 'Kepujian', band: 'TP3 (Memuaskan)', color: 'text-indigo-700 bg-indigo-50 border-indigo-300' },
  { minPercent: 50, grade: 'C' as const, title: 'Lulus', band: 'TP3 (Memuaskan Asas)', color: 'text-blue-700 bg-blue-50 border-blue-300' },
  { minPercent: 45, grade: 'D' as const, title: 'Lulus', band: 'TP2 (Tahap Minimum)', color: 'text-amber-700 bg-amber-50 border-amber-300' },
  { minPercent: 40, grade: 'E' as const, title: 'Lulus Minimum', band: 'TP2 (Tahap Minimum)', color: 'text-orange-700 bg-orange-50 border-orange-300' },
  { minPercent: 0, grade: 'G' as const, title: 'Gagal / Perlu Bimbingan', band: 'TP1 (Perlu Bimbingan Khusus)', color: 'text-rose-700 bg-rose-50 border-rose-300' },
];

export const SPM_GRADE_SCALE = [
  { grade: 'A+', label: 'Cemerlang Tertinggi', tpLevel: 'TP6 (Sangat Cemerlang & Fasih)', minPercentage: 85, maxPercentage: 100 },
  { grade: 'A', label: 'Cemerlang', tpLevel: 'TP5 (Cemerlang & Matang)', minPercentage: 80, maxPercentage: 84 },
  { grade: 'A-', label: 'Cemerlang', tpLevel: 'TP5 (Cemerlang)', minPercentage: 75, maxPercentage: 79 },
  { grade: 'B+', label: 'Kepujian Tertinggi', tpLevel: 'TP4 (Kepujian Tinggi)', minPercentage: 70, maxPercentage: 74 },
  { grade: 'B', label: 'Kepujian Tinggi', tpLevel: 'TP4 (Kepujian)', minPercentage: 65, maxPercentage: 69 },
  { grade: 'C+', label: 'Kepujian', tpLevel: 'TP3 (Memuaskan)', minPercentage: 60, maxPercentage: 64 },
  { grade: 'C', label: 'Lulus', tpLevel: 'TP3 (Memuaskan Asas)', minPercentage: 50, maxPercentage: 59 },
  { grade: 'D', label: 'Lulus', tpLevel: 'TP2 (Tahap Minimum)', minPercentage: 45, maxPercentage: 49 },
  { grade: 'E', label: 'Lulus Minimum', tpLevel: 'TP2 (Tahap Minimum)', minPercentage: 40, maxPercentage: 44 },
  { grade: 'G', label: 'Gagal / Perlu Bimbingan', tpLevel: 'TP1 (Perlu Bimbingan Khusus)', minPercentage: 0, maxPercentage: 39 },
];

export function calculateSpmGrade(rawScore: number, maxScore = 40): SpmGradeInfo {
  const percentage = Math.min(100, Math.max(0, Math.round((rawScore / maxScore) * 100)));
  
  let gradeIndex = 0;
  for (let i = 0; i < SPM_GRADE_THRESHOLDS.length; i++) {
    if (percentage >= SPM_GRADE_THRESHOLDS[i].minPercent) {
      gradeIndex = i;
      break;
    }
  }

  const currentTier = SPM_GRADE_THRESHOLDS[gradeIndex];
  
  // Calculate gap to next higher grade
  let nextGradeTips: string | undefined = undefined;
  let scoreGap: number | undefined = undefined;
  let nextGrade: string | undefined = undefined;

  if (gradeIndex > 0) {
    const higherTier = SPM_GRADE_THRESHOLDS[gradeIndex - 1];
    const targetScoreNeeded = Math.ceil((higherTier.minPercent / 100) * maxScore);
    scoreGap = Math.max(1, targetScoreNeeded - rawScore);
    nextGrade = higherTier.grade;

    if (higherTier.grade === 'A+') {
      nextGradeTips = `Hebat! Anda hanya memerlukan ${scoreGap} markah lagi untuk merebut Gred A+ (Cemerlang Tertinggi)! Tingkatkan penggunaan peribahasa SPM dan sebutan baku tanpa jeda.`;
    } else if (higherTier.grade === 'A' || higherTier.grade === 'A-') {
      nextGradeTips = `Peluang cerah! Tambah ${scoreGap} markah lagi untuk melonjak ke Gred ${higherTier.grade}. Gunakan penanda wacana pelbagai seperti "Tuntasnya", "Sebagai analoginya".`;
    } else {
      nextGradeTips = `Perlukan ${scoreGap} markah lagi untuk mencapai Gred ${higherTier.grade}. Perkukuh binaan ayat majmuk dan pastikan isi disokong huraian serta contoh.`;
    }
  } else {
    nextGradeTips = 'Tahniah! Anda telah mencapai Gred A+ (Aras Cemerlang Tertinggi SPM)! Kekalkan momentum dan perbanyakkan simulasi bertutur.';
  }

  return {
    rawScore,
    maxScore,
    percentage,
    grade: currentTier.grade,
    gradeTitle: currentTier.title,
    label: currentTier.title,
    band: currentTier.band,
    tpLevel: currentTier.band,
    color: currentTier.color,
    nextGradeTips,
    scoreGap,
    gapToNextGrade: scoreGap,
    nextGrade,
  };
}
