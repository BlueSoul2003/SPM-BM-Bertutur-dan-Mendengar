import { ExerciseItem, DictionaryData } from "../types";

export { SPM_SPEAKING_TOPICS } from "./spmSpeakingTopics";
export { SPM_LISTENING_TRACKS } from "./spmListeningTracks";

export const SPM_EXERCISES: ExerciseItem[] = [
  {
    id: 'ex-seb-1',
    category: 'pronunciation',
    title: 'Sebutan Baku: Huruf e-pepet vs e-taling',
    question: 'Pilih perkataan yang mengandungi sebutan [e-taling] seperti dalam perkataan "béka" / "télégraf":',
    options: ['A. Kemelut (ke-me-lut)', 'B. Rekreasi (rék-ré-a-si)', 'C. Gemilang (ge-mi-lang)', 'D. Penawar (pe-na-war)'],
    correctAnswer: 'B. Rekreasi (rék-ré-a-si)',
    explanation: 'Huruf "e" dalam "rekreasi" dibunyikan dengan bunyi e-taling [é], manakala kemelut, gemilang dan penawar menggunakan bunyi e-pepet [ə].',
    targetPhrase: 'Aktiviti rekreasi di kawasan pergunungan amat menyegarkan minda.'
  },
  {
    id: 'ex-seb-2',
    category: 'pronunciation',
    title: 'Intonasi dan Jeda Ayat Majmuk Bertingkat',
    question: 'Di manakah kedudukan jeda (henti sebentar) yang paling tepat dalam sebutan lisan rasmi SPM?',
    options: [
      'A. Walaupun negara / mencapai kemajuan fizikal / kita tidak wajar / mengabaikan nilai murni.',
      'B. Walaupun negara mencapai kemajuan fizikal, [JEDA] kita tidak wajar mengabaikan nilai-nilai murni dalam sanubari masyarakat.',
      'C. Walaupun / negara mencapai / kemajuan.',
      'D. Tiada sebarang jeda diperlukan dalam ayat formal.'
    ],
    correctAnswer: 'B. Walaupun negara mencapai kemajuan fizikal, [JEDA] kita tidak wajar mengabaikan nilai-nilai murni dalam sanubari masyarakat.',
    explanation: 'Dalam penyampaian lisan SPM yang berkesan, jeda pendek diletakkan selepas klausa bersandar (tanda koma) untuk memberikan penekanan dan irama wacana yang mantap.',
    targetPhrase: 'Walaupun negara mencapai kemajuan fizikal, kita tidak wajar mengabaikan nilai-nilai murni dalam sanubari masyarakat.'
  },
  {
    id: 'ex-tat-1',
    category: 'grammar',
    title: 'Kesalahan Hukum D-M (Diterangkan - Menerangkan)',
    question: 'Kenal pasti frasa yang mematuhi Hukum D-M dengan betul mengikut Tatabahasa Dewan:',
    options: [
      'A. cili sos',
      'B. pendingin hawa bilik',
      'C. lain-lain perkara',
      'D. mini bas'
    ],
    correctAnswer: 'B. pendingin hawa bilik',
    explanation: 'Menurut Hukum D-M, unsur yang diterangkan (D) mesti mendahului unsur yang menerangkan (M). Oleh itu "pendingin hawa" betul (bukan hawa dingin), "sos cili" betul (bukan cili sos), "perkara-perkara lain" betul (bukan lain-lain perkara), dan "bas mini" betul (bukan mini bas).',
    targetPhrase: 'Pengurus itu memasang alat pendingin hawa di dalam bilik mesyuarat utama.'
  },
  {
    id: 'ex-tat-2',
    category: 'grammar',
    title: 'Penggunaan Kata Sendi Nama: "di" vs "pada" & "kepada"',
    question: 'Pilih ayat yang menggunakan kata sendi nama dengan BETUL:',
    options: [
      'A. Surat rasmi itu diserahkan di pengetua sekolah semalam.',
      'B. Bantuan persekolahan itu diagihkan kepada murid yang layak.',
      'C. Pelajar dikehendaki berkumpul pada padang sekolah.',
      'D. Kejayaan ini dihadiahkan di kedua-dua ibu bapa saya.'
    ],
    correctAnswer: 'B. Bantuan persekolahan itu diagihkan kepada murid yang layak.',
    explanation: 'Kata sendi "kepada" digunakan untuk menyatakan sasaran manusia atau institusi. "Di" hanya untuk tempat/lokasi fizikal. "Pada" digunakan untuk masa, orang (ada pada), atau haiwan/benda abstrak.',
    targetPhrase: 'Bantuan persekolahan itu diagihkan kepada murid yang layak.'
  },
  {
    id: 'ex-kos-1',
    category: 'vocabulary',
    title: 'Kosa Kata Aras Tinggi: Menggantikan Perkataan Biasa',
    question: 'Apakah kosa kata aras tinggi SPM yang paling tepat bagi menggantikan perkataan "faedah / kebaikan"?',
    options: [
      'A. Maslahat / Kemaslahatan',
      'B. Pancaroba',
      'C. Kekangan',
      'D. Kemelut'
    ],
    correctAnswer: 'A. Maslahat / Kemaslahatan',
    explanation: '"Maslahat / Kemaslahatan" bermaksud faedah, kebaikan atau guna. "Pancaroba" bermaksud cabaran/dugaan, manakala "kekangan/kemelut" bermaksud halangan/masalah.',
    targetPhrase: 'Kempen membaca ini membawa seribu satu kemaslahatan kepada warga sekolah.'
  },
  {
    id: 'ex-kos-2',
    category: 'vocabulary',
    title: 'Peribahasa SPM Mengikut Konteks Perpaduan',
    question: 'Pilih peribahasa yang paling sesuai untuk menggambarkan "usaha bersatu-padu tanpa mengira kaum demi kesejahteraan negara":',
    options: [
      'A. Hendak seribu daya, tak hendak seribu dalih',
      'B. Bagai aur dengan tebing, berat sama dipikul ringan sama dijinjing',
      'C. Seperti katak di bawah tempurung',
      'D. Sudah jatuh ditimpa tangga'
    ],
    correctAnswer: 'B. Bagai aur dengan tebing, berat sama dipikul ringan sama dijinjing',
    explanation: 'Peribahasa "bagai aur dengan tebing" dan "berat sama dipikul ringan sama dijinjing" melambangkan semangat kerjasama erat, tolong-menolong dan perpaduan teguh.',
    targetPhrase: 'Masyarakat berbilang kaum hidup bersatu padu bagai aur dengan tebing.'
  }
];

export const BUILTIN_DICTIONARY: Record<string, DictionaryData> = {
  'meruncing': {
    word: 'meruncing',
    rootWord: 'runcing',
    partOfSpeech: 'Kata Kerja / Kata Adjektif',
    definitions: {
      ms: 'Menjadi semakin genting, tegang, atau bertambah parah (berkenaan masalah, perselisihan, penyakit, atau situasi krisis).',
      en: 'To become critical, acute, worsening, or escalating (of a crisis or tension).',
      zh: '（形势或危机）变得尖锐、严重、恶化或紧迫。',
      ta: 'நிலமை மோசமடைதல் / தீவிரமடைதல்.'
    },
    synonyms: ['genting', 'gawat', 'parah', 'meruncingkan', 'kritikal'],
    antonyms: ['reda', 'pulih', 'tenteram', 'stabil'],
    spmSampleSentence: 'Kemelut pencemaran sungai yang kian meruncing ini menuntut tindakan drastik daripada semua pihak yang berwewenang.',
    spmTips: 'Gunakan dalam perenggan pengenalan atau huraian masalah karangan/lisan SPM bagi menggantikan "semakin teruk".'
  },
  'seantero': {
    word: 'seantero',
    rootWord: 'antero',
    partOfSpeech: 'Kata Bilangan / Penerang',
    definitions: {
      ms: 'Seluruh; segenap; merangkumi semua bahagian kawasan atau dunia.',
      en: 'Entire, whole, throughout the whole area or world.',
      zh: '整个、全、全天下、全世界。',
      ta: 'முழுவதும் / உலகம் முழுவதும்.'
    },
    synonyms: ['seluruh', 'segenap', 'segenap pelosok', 'sarwajagat'],
    antonyms: ['sebahagian', 'setempat'],
    spmSampleSentence: 'Nama tokoh pendidik itu termasyhur di seantero pelosok nusantara berkat sumbangan ilmunya yang tiada tandingan.',
    spmTips: 'Frasa menarik SPM: "di seantero pelosok dunia" atau "di seantero negara".'
  },
  'lestari': {
    word: 'lestari',
    rootWord: 'lestari',
    partOfSpeech: 'Kata Adjektif',
    definitions: {
      ms: 'Kekal, tidak berubah, terpelihara dalam keadaan asal secara berterusan tanpa mengalami kemusnahan.',
      en: 'Sustainable, enduring, everlasting, preserved in perpetuity.',
      zh: '永恒的、可持续发展的、永续的。',
      ta: 'நிலையான / நீடித்த / அழியாத.'
    },
    synonyms: ['kekal', 'abadi', 'mapan', 'terpelihara'],
    antonyms: ['musnah', 'pupus', 'sementara', 'lenyap'],
    spmSampleSentence: 'Pembangunan fizikal negara mestilah seiring dengan pemeliharaan ekosistem demi menjamin alam sekitar yang lestari untuk generasi mendatang.',
    spmTips: 'Sangat lazim dalam tema Alam Sekitar SPM: "pembangunan lestari", "kelestarian global".'
  },
  'maslahat': {
    word: 'maslahat',
    rootWord: 'maslahat',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Faedah, guna, keuntungan, kebaikan, atau manfaat yang diperoleh.',
      en: 'Benefit, advantage, utility, public good or welfare.',
      zh: '利益、好处、福祉、益处。',
      ta: 'நன்மை / பயன் / லாபம்.'
    },
    synonyms: ['faedah', 'manfaat', 'keuntungan', 'kemaslahatan', 'kebaikan'],
    antonyms: ['mudarat', 'kemudaratan', 'kerugian', 'keburukan'],
    spmSampleSentence: 'Amalan gaya hidup sihat membawa seribu satu maslahat kepada kecergasan jasmani dan ketajaman minda remaja.',
    spmTips: 'Gantikan perkataan biasa "faedah/kebaikan" dengan "kemaslahatan" dalam huraian isi SPM.'
  },
  'swadaya': {
    word: 'swadaya',
    rootWord: 'swadaya',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Kekuatan, usaha, atau daya tenaga sendiri tanpa bergantung pada bantuan pihak luar.',
      en: 'Self-reliance, self-effort, one\'s own initiative and strength.',
      zh: '自力更生、依靠自身力量。',
      ta: 'சுயமுயற்சி / தன்முனைப்பு.'
    },
    synonyms: ['usaha kendiri', 'daya usaha sendiri', 'inisiatif kendiri'],
    antonyms: ['kebergantungan', 'mengharap bantuan'],
    spmSampleSentence: 'Golongan belia wajar bangkit dengan swadaya sendiri dalam memulakan perniagaan e-dagang.',
    spmTips: 'Gunakan frasa "atas swadaya sendiri" untuk menunjukkan kemandirian watak.'
  },
  'sinergi': {
    word: 'sinergi',
    rootWord: 'sinergi',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Kerjasama, gandingan, atau usaha bersepadu antara pelbagai pihak yang menghasilkan impak yang lebih hebat.',
      en: 'Synergy; collaborative action producing a combined effect greater than the sum of separate parts.',
      zh: '协同效应、合力、协作增效。',
      ta: 'கூட்டு முயற்சி / ஒருங்கிணைந்த செயல்பாடு.'
    },
    synonyms: ['kerjasama', 'gandingan padu', 'kolaborasi', 'paduan tenaga'],
    antonyms: ['perpecahan', 'persengketaan', 'bergerak solo'],
    spmSampleSentence: 'Sinergi padu antara pihak sekolah dengan Persatuan Ibu Bapa dan Guru (PIBG) ibarat aur dengan tebing.',
    spmTips: 'Gunakan dalam perenggan peranan pelbagai pihak / kesimpulan SPM: "sinergi pelbagai pihak".'
  },
  'marhaen': {
    word: 'marhaen',
    rootWord: 'marhaen',
    partOfSpeech: 'Kata Nama / Penerang',
    definitions: {
      ms: 'Rakyat biasa, golongan bawahan, masyarakat awam yang berpendapatan sederhana atau rendah.',
      en: 'Common people, the masses, grassroots, plebeian populace.',
      zh: '平民、草根阶层、老百姓。',
      ta: 'சாமானிய மக்கள் / பொதுமக்கள்.'
    },
    synonyms: ['rakyat jelata', 'masyarakat awam', 'golongan terbanyak', 'rakyat marhaen'],
    antonyms: ['golongan bangsawan', 'elit', 'hartawan'],
    spmSampleSentence: 'Inisiatif subsidi bersasar ini amat melegakan beban sara hidup yang ditanggung oleh golongan marhaen.',
    spmTips: 'Gunakan frasa "golongan marhaen" bagi menggantikan "orang biasa / rakyat biasa".'
  },
  'obligasi': {
    word: 'obligasi',
    rootWord: 'obligasi',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Kewajipan, tanggungjawab, atau tugas moral/undang-undang yang wajib dipikul.',
      en: 'Obligation, bound duty, mandatory responsibility.',
      zh: '义务、职责、责任。',
      ta: 'கடமை / பொறுப்பு.'
    },
    synonyms: ['tanggungjawab', 'kewajipan', 'amanah', 'tugas'],
    antonyms: ['pilihan bebas', 'kelonggaran'],
    spmSampleSentence: 'Menjaga keamanan dan kemakmuran tanah air tercinta merupakan obligasi suci setiap warganegara Malaysia.',
    spmTips: 'Kosa kata tinggi untuk menggantikan "tanggungjawab".'
  },
  'pancaroba': {
    word: 'pancaroba',
    rootWord: 'pancaroba',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Keadaan yang penuh dengan pelbagai perubahan, cabaran, ujian, dan rintangan yang menguji kesabaran.',
      en: 'Turbulence, trials, tribulations, changing vicissitudes of life.',
      zh: '沧桑变幻、磨难、风浪、严峻考验。',
      ta: 'சோதனைகள் / இடையூறுகள் / திருப்பங்கள்.'
    },
    synonyms: ['cabaran', 'onak duri', 'ranjau hidup', 'dugaan'],
    antonyms: ['kesenangan', 'kelancaran', 'kemudahan'],
    spmSampleSentence: 'Remaja masa kini perlu mempunyai ketahanan mental yang ampuh agar mampu mendepani pancaroba era globalisasi.',
    spmTips: 'Frasa menarik SPM: "mendepani pancaroba hidup" atau "arus pancaroba dunia siber".'
  },
  'seyogia': {
    word: 'seyogia',
    rootWord: 'seyogia',
    partOfSpeech: 'Kata Tugas / Kata Bantu',
    definitions: {
      ms: 'Sepatutnya, sewajarnya, semestinya, selayaknya (digunakan sebelum cadangan atau nasihat).',
      en: 'Ought to, should, appropriately, rightfully.',
      zh: '理应、应当、应该、适宜。',
      ta: 'முறையாக / அவசியமாக / செய்யப்பட வேண்டும்.'
    },
    synonyms: ['sepatutnya', 'sewajarnya', 'seharusnyalah', 'seyogianya'],
    antonyms: ['mustahil', 'tidak wajar'],
    spmSampleSentence: 'Ibu bapa seyogianya menunjukkan teladan yang terpuji kepada anak-anak sejak kecil lagi bagai menatang minyak yang penuh.',
    spmTips: 'Gunakan frasa "Seyogianya, semua pihak..." untuk memulakan ayat cadangan/langkah.'
  },
  'kekangan': {
    word: 'kekangan',
    rootWord: 'kekang',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Halangan, sekatan, rintangan, atau batasan yang menyukarkan sesuatu tindakan.',
      en: 'Constraint, restriction, impediment, limitation.',
      zh: '限制、阻碍、拘束、约束。',
      ta: 'கட்டுப்பாடு / தடை / வரம்பு.'
    },
    synonyms: ['halangan', 'sekatan', 'rintangan', 'batasan', 'aral'],
    antonyms: ['kebebasan', 'kelonggaran', 'kemudahan'],
    spmSampleSentence: 'Kekangan kewangan bukanlah alasan untuk kita berputus asa dalam menuntut ilmu di menara gading.',
    spmTips: 'Gantikan perkataan "masalah/halangan" dengan "kekangan" dalam huraian faktor.'
  },
  'stigma': {
    word: 'stigma',
    rootWord: 'stigma',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Tanggapan negatif, prasangka buruk, atau celaan masyarakat terhadap sesuatu isu atau golongan.',
      en: 'Social stigma, negative prejudice, mark of disgrace.',
      zh: '耻辱、负面标签、社会偏见。',
      ta: 'களங்கம் / அவப்பெயர் / எதிர்மறை பார்வை.'
    },
    synonyms: ['prasangka', 'persepsi negatif', 'pandangan serong', 'celaan'],
    antonyms: ['penerimaan positif', 'sanjungan', 'penghormatan'],
    spmSampleSentence: 'Kita perlu mengikis stigma masyarakat terhadap pesakit mental agar mereka tidak berasa terpinggir.',
    spmTips: 'Frasa tinggi: "mengikis stigma lapuk masyarakat" dalam tema Kesihatan & Sosial SPM.'
  },
  'mustahak': {
    word: 'mustahak',
    rootWord: 'mustahak',
    partOfSpeech: 'Kata Adjektif',
    definitions: {
      ms: 'Sangat penting, amat berfaedah, genting, atau tidak boleh diabaikan.',
      en: 'Essential, critical, imperative, very important.',
      zh: '极其重要的、不可或缺的、紧要的。',
      ta: 'மிகவும் முக்கியமானது / அத்தியாவசியமானது.'
    },
    synonyms: ['penting', 'signifikan', 'kritikal', 'vital', 'maslahat'],
    antonyms: ['remeh', 'sia-sia', 'tidak berfaedah'],
    spmSampleSentence: 'Kerjasama erat antara ibu bapa dan guru amat mustahak demi kecemerlangan sahsiah murid.',
    spmTips: 'Gantikan perkataan biasa "amat penting" dengan "amat mustahak dan signifikan".'
  },
  'integriti': {
    word: 'integriti',
    rootWord: 'integriti',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Kejujuran, keutuhan watak, ketulusan moral, dan keteguhan berpegang pada prinsip kebenaran.',
      en: 'Integrity, moral uprightness, honesty, adherence to ethical principles.',
      zh: '廉洁、正直、诚信、道德操守。',
      ta: 'நாணயம் / நேர்மை / ஒழுக்க உறுதி.'
    },
    synonyms: ['kejujuran', 'ketulusan', 'amanah', 'kredibiliti'],
    antonyms: ['penyelewengan', 'rasuah', 'kecurangan'],
    spmSampleSentence: 'Penghayatan nilai integriti yang teguh mampu membentengi generasi muda daripada gejala rasuah.',
    spmTips: 'Kosa kata teras SPM untuk tema Sivik, Jenayah Siber, dan Kepimpinan.'
  },
  'berhemah': {
    word: 'berhemah',
    rootWord: 'hemah',
    partOfSpeech: 'Kata Adjektif / Kata Keterangan',
    definitions: {
      ms: 'Mempunyai budi pekerti yang mulia, bertatasusila, berhati-hati, dan bijaksana dalam membuat keputusan.',
      en: 'Prudent, courteous, considerate, tactful, well-mannered.',
      zh: '有涵养的、谨言慎行的、谨慎审慎的。',
      ta: 'விவேகமுள்ள / கண்ணியமான / நற்பண்புள்ள.'
    },
    synonyms: ['berbudi bahasa', 'beradab', 'bertatatertib', 'bijaksana', 'berhati-hati'],
    antonyms: ['gopoh-gapah', 'kurang ajar', 'melulu'],
    spmSampleSentence: 'Pengguna jalan raya dinasihatkan agar memandu secara berhemah demi meminimumkan kadar kemalangan jalan raya.',
    spmTips: 'Gunakan frasa "berbelanja secara berhemah" atau "berkomunikasi secara berhemah".'
  },
  'ukhuwah': {
    word: 'ukhuwah',
    rootWord: 'ukhuwah',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Tali persaudaraan, keakraban ikatan silaturahim, dan semangat persahabatan yang erat.',
      en: 'Brotherhood, fraternal bond, kinship, solidarity.',
      zh: '兄弟情谊、深厚情谊、纽带。',
      ta: 'சகோதரத்துவம் / நட்புப் பிணைப்பு.'
    },
    synonyms: ['persaudaraan', 'silaturahim', 'keakraban', 'integrasi'],
    antonyms: ['permusuhan', 'perpecahan', 'persengketaan'],
    spmSampleSentence: 'Aktiviti gotong-royong perdana berjaya menyuburkan benih ukhuwah dalam kalangan penduduk kampung.',
    spmTips: 'Sangat padan digunakan dalam tema Perpaduan Kaum dan Kemasyarakatan SPM.'
  },
  'ampuh': {
    word: 'ampuh',
    rootWord: 'ampuh',
    partOfSpeech: 'Kata Adjektif',
    definitions: {
      ms: 'Sangat berkesan, mujarab, bertenaga, atau kuat hasilnya.',
      en: 'Potent, formidable, highly effective, powerful.',
      zh: '强有力的、行之有效的、灵验的。',
      ta: 'மிகவும் ஆற்றல் வாய்ந்த / பயனுள்ள.'
    },
    synonyms: ['berkesan', 'mujarab', 'efektif', 'mantap'],
    antonyms: ['lemah', 'sia-sia', 'tidak berkesan'],
    spmSampleSentence: 'Pendidikan merupakan senjata paling ampuh untuk mengubah taraf kehidupan sesebuah keluarga.',
    spmTips: 'Gantikan "langkah berkesan" dengan "wadah / langkah yang paling ampuh".'
  },
  'holistik': {
    word: 'holistik',
    rootWord: 'holistik',
    partOfSpeech: 'Kata Adjektif',
    definitions: {
      ms: 'Menyeluruh, mencakupi setiap aspek secara bersepadu tanpa ada yang tertinggal.',
      en: 'Holistic, comprehensive, all-encompassing.',
      zh: '全面的、全盘的、整体性的。',
      ta: 'முழுமையான / ஒருங்கிணைந்த.'
    },
    synonyms: ['menyeluruh', 'komprehensif', 'bersepadu', 'total'],
    antonyms: ['separa', 'terhad', 'sempit'],
    spmSampleSentence: 'Pendekatan secara holistik perlu digembleng oleh semua kementerian untuk membasmi kemiskinan tegar.',
    spmTips: 'Frasa emas SPM: "langkah penyelesaian yang holistik dan pragmatik".'
  },
  'pencemaran': {
    word: 'pencemaran',
    rootWord: 'cemar',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Perbuatan atau keadaan mengotori alam sekitar (udara, air, tanah, bunyi) dengan bahan toksik berbahaya.',
      en: 'Pollution, contamination of the natural environment.',
      zh: '污染、玷污。',
      ta: 'மாசுபாடு / சூழல் சீர்கேடு.'
    },
    synonyms: ['pengotoran', 'kontaminasi', 'kemusnahan alam'],
    antonyms: ['pemuliharaan', 'kebersihan', 'kelestarian'],
    spmSampleSentence: 'Pencemaran sisa toksik ke dalam sungai telah melumpuhkan bekalan air bersih kepada jutaan pengguna.',
    spmTips: 'Gunakan bersama kata penguat seperti "pencemaran yang kian meruncing".'
  },
  'kemelut': {
    word: 'kemelut',
    rootWord: 'kemelut',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Keadaan krisis yang gawat, genting, berbelit-belit, dan memerlukan jalan penyelesaian segera.',
      en: 'Crisis, entanglement, predicament, turbulent state.',
      zh: '危机、困境、纷争。',
      ta: 'நெருக்கடி / இக்கட்டான நிலை.'
    },
    synonyms: ['krisis', 'kesulitan', 'masalah rumit', 'kebuntuan'],
    antonyms: ['kedamaian', 'penyelesaian', 'ketenteraman'],
    spmSampleSentence: 'Pihak pentadbir perlu mencari resolusi konkrit bagi merungkaikan kemelut disiplin murid.',
    spmTips: 'Gantikan perkataan "masalah" dengan "kemelut".'
  },
  'anjakan': {
    word: 'anjakan',
    rootWord: 'anjak',
    partOfSpeech: 'Kata Nama',
    definitions: {
      ms: 'Perubahan dasar, pergerakan haluan, atau peralihan paradigma ke arah pemikiran baharu.',
      en: 'Shift, paradigm transition, realignment.',
      zh: '转变、跨越、转型。',
      ta: 'மாற்றம் / நிலைமாற்றம்.'
    },
    synonyms: ['perubahan', 'peralihan', 'transformasi'],
    antonyms: ['ketakukan', 'kebekuan pemikiran'],
    spmSampleSentence: 'Pelan Pembangunan Pendidikan Malaysia menggariskan anjakan paradigma untuk melahirkan murid bertaraf global.',
    spmTips: 'Frasa standard cemerlang SPM: "anjakan paradigma" (paradigm shift).'
  }
};
