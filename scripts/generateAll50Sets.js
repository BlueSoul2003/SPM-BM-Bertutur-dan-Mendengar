import fs from 'fs';

// 52 Speaking Topics Covering All SPM Themes
const speakingData = [
  // 1-4: Kesihatan & Sukan
  {
    title: 'Faedah Bersukan dan Mengamalkan Gaya Hidup Cergas',
    theme: 'Kesihatan dan Sukan',
    level: 'Tingkatan 4',
    type: 'individu',
    difficulty: 'mudah',
    stimulusText: 'Aktiviti bersukan merupakan amalan riadah yang menyihatkan tubuh badan dan mencerdaskan minda. Melibatkan diri dalam sukan seperti badminton, bola sepak, dan berbasikal dapat membakar kalori, mengurangkan tekanan belajar, dan memupuk disiplin kendiri. Selain itu, bersukan bersama keluarga dan rakan-rakan mampu mengeratkan silaturahim serta menjauhkan remaja daripada gejala negatif.',
    guideQuestions: [
      'Apakah faedah bersukan terhadap kesihatan fizikal dan mental murid?',
      'Nyatakan jenis sukan yang paling anda gemari dan berikan sebabnya.',
      'Bagaimanakah pihak sekolah boleh menggalakkan murid aktif bersukan?',
      'Apakah kesan buruk sekiranya seseorang mengabaikan aktiviti riadah?'
    ],
    examinerQuestions: [
      'Pada pandangan anda, mengapakah sesetengah murid lebih gemar bermain permainan video berbanding bersukan?',
      'Bagaimanakah anda mengimbangi masa antara belajar dengan bersukan?'
    ],
    vocabulary: [
      { word: 'cergas', meaning: 'aktif, bertenaga dan sihat' },
      { word: 'silaturahim', meaning: 'tali persaudaraan dan hubungan mesra' },
      { word: 'disiplin kendiri', meaning: 'kawalan diri untuk patuh pada jadual' },
      { word: 'riadah', meaning: 'senaman ringan dan rekreasi' }
    ]
  },
  {
    title: 'Kepentingan Pemakanan Seimbang dan Diet Sihat Remaja',
    theme: 'Kesihatan dan Kebersihan',
    level: 'Tingkatan 4',
    type: 'individu',
    difficulty: 'mudah',
    stimulusText: 'Amalan pemakanan seimbang mengikut Pinggan Sihat Malaysia (Suku-suku Separuh) amat mustahak untuk tumbesaran remaja. Pengambilan karbohidrat kompleks, protein tanpa lemak, serta sayur-sayuran dan buah-buahan segar membekalkan tenaga berterusan untuk aktiviti seharian. Sebaliknya, tabiat memakan makanan segera dan bergula tinggi membawa risiko obesiti serta diabetes pada usia muda.',
    guideQuestions: [
      'Apakah konsep Pinggan Sihat Malaysia yang disarankan oleh Kementerian Kesihatan?',
      'Mengapakah remaja kerap terdorong untuk menikmati makanan segera?',
      'Apakah kesan jangka panjang amalan diet tidak seimbang terhadap remaja?',
      'Bagaimanakah ibu bapa dapat membentuk tabiat pemakanan sihat di rumah?'
    ],
    examinerQuestions: [
      'Sejauh manakah kantin sekolah memainkan peranan dalam menyediakan menu berkhasiat?',
      'Apakah langkah yang anda ambil untuk memastikan diet harian anda berkhasiat?'
    ],
    vocabulary: [
      { word: 'nutrisi', meaning: 'zat makanan yang diperlukan oleh tubuh' },
      { word: 'obesiti', meaning: 'keadaan kegemukan melampau yang menjejaskan kesihatan' },
      { word: 'kadar metabolisme', meaning: 'kecepatan badan memproses tenaga' },
      { word: 'moderat', meaning: 'amalan bersederhana dan seimbang' }
    ]
  },
  {
    title: 'Langkah Mengatasi Tekanan dan Menjaga Kesihatan Mental Pelajar',
    theme: 'Kesihatan dan Kesejahteraan',
    level: 'Tingkatan 5',
    type: 'individu',
    difficulty: 'sederhana',
    stimulusText: 'Kesihatan mental murid sekolah menengah semakin mendapat perhatian umum, terutamanya menjelang musim peperiksaan SPM. Bebanan tugasan, jangkaan tinggi keluarga, dan persaingan akademik sering mencetuskan kegelisahan yang melampau. Oleh itu, remaja perlu menguasai teknik pengurusan emosi seperti latihan pernafasan, berkongsi masalah dengan guru kaunseling, dan meluangkan masa beristirahat.',
    guideQuestions: [
      'Apakah faktor utama yang menyumbang kepada tekanan dalam kalangan calon SPM?',
      'Bagaimanakah guru bimbingan dan kaunseling dapat membantu murid yang tertekan?',
      'Apakah peranan rakan sebaya dalam memberikan sokongan moral?',
      'Mengapakah kita tidak wajar memandang remeh isu kesihatan mental?'
    ],
    examinerQuestions: [
      'Bagaimanakah anda sendiri menenangkan fikiran apabila menghadapi kebuntuan dalam pelajaran?',
      'Apakah aktiviti relaksasi yang paling berkesan untuk memulihkan semangat anda?'
    ],
    vocabulary: [
      { word: 'kesejahteraan mental', meaning: 'keadaan fikiran yang tenang dan sihat' },
      { word: 'intervensi', meaning: 'langkah campur tangan untuk memulihkan keadaan' },
      { word: 'stigma', meaning: 'tanggapan negatif masyarakat terhadap sesuatu perkara' },
      { word: 'daya tahan', meaning: 'keupayaan bangkit semula selepas menghadapi kesukaran' }
    ]
  },
  {
    title: 'Amalan Tidur Berkualiti dan Kesannya terhadap Prestasi Akademik',
    theme: 'Kesihatan dan Sains Hayat',
    level: 'Tingkatan 4',
    type: 'kumpulan',
    difficulty: 'sederhana',
    stimulusText: 'Kajian kesihatan menunjukkan bahawa remaja memerlukan tidur antara tujuh hingga sembilan jam setiap malam untuk pertumbuhan sel saraf yang optimum. Fenomena berjaga malam untuk mengulang kaji pelajaran atau melayari gajet elektronik bukan sahaja melemahkan daya ingatan, bahkan mengurangkan fokus semasa sesi pembelajaran di dalam bilik darjah.',
    guideQuestions: [
      'Berapa jamkah waktu tidur yang ideal untuk seorang pelajar sekolah menengah?',
      'Apakah punca kebanyakan murid gemar tidur larut malam pada hari persekolahan?',
      'Huraikan kesan kekurangan tidur terhadap keupayaan mengingat dan menaakul.',
      'Cadangkan cara mengatur jadual harian agar murid mendapat tidur yang mencukupi.'
    ],
    examinerQuestions: [
      'Apakah tindakan anda jika mendapati diri anda kerap mengantuk semasa guru mengajar?',
      'Mengapakah amalan mematikan telefon bimbit sebelum tidur sangat digalakkan?'
    ],
    vocabulary: [
      { word: 'insomnia', meaning: 'masalah sukar untuk tidur nyenyak' },
      { word: 'ritma sirkadian', meaning: 'jam biologi tubuh manusia sepanjang 24 jam' },
      { word: 'kepekaan kognitif', meaning: 'ketajaman daya pemikiran dan ingatan' },
      { word: 'kebajikan fizikal', meaning: 'kesihatan tubuh secara menyeluruh' }
    ]
  },

  // 5-8: Alam Sekitar & Kelestarian Hijau
  {
    title: 'Amalan Kitar Semula dan Pengurangan Penggunaan Plastik Sekali Guna',
    theme: 'Alam Sekitar dan Teknologi Hijau',
    level: 'Tingkatan 4',
    type: 'individu',
    difficulty: 'mudah',
    stimulusText: 'Pencemaran sisa plastik sekali guna merupakan ancaman serius terhadap ekosistem marin dan daratan. Kempen Hari Tanpa Beg Plastik dan penerapan prinsip 3R (Kurangkan, Guna Semula, Kitar Semula) wajar dibudayakan bermula dari bangku sekolah. Penggunaan beg mesra alam dan bekas makanan sendiri mampu mengurangkan lambakan sampah di tapak pelupusan secara drastik.',
    guideQuestions: [
      'Apakah kesan pembuangan sisa plastik terhadap hidupan marin dan sungai?',
      'Nyatakan amalan 3R yang paling mudah diamalkan oleh murid setiap hari.',
      'Bagaimanakah pihak berkuasa tempatan boleh memperluas pusat pengumpulan kitar semula?',
      'Apakah ganjaran yang wajar diberikan kepada sekolah berstatus lestari hijau?'
    ],
    examinerQuestions: [
      'Apakah inovasi alternatif kepada penyedut minuman plastik yang anda ketahui?',
      'Bagaimanakah anda meyakinkan ahli keluarga untuk mengasingkan sampah di rumah?'
    ],
    vocabulary: [
      { word: 'terbiodegradasi', meaning: 'mudah reput secara semula jadi oleh bakteria' },
      { word: 'kelestarian', meaning: 'keadaan kekal terpelihara untuk jangka panjang' },
      { word: 'ekosistem', meaning: 'sistem saling bergantung antara hidupan dan alam sekitar' },
      { word: 'mikroplastik', meaning: 'zarah plastik halus yang mencemarkan rantaian makanan' }
    ]
  },
  {
    title: 'Peranan Komuniti dalam Memelihara Kebersihan Sungai dan Sumber Air',
    theme: 'Alam Sekitar dan Komuniti',
    level: 'Tingkatan 5',
    type: 'individu',
    difficulty: 'sederhana',
    stimulusText: 'Sungai bukan sekadar punca bekalan air mentah domestik, malah menjadi habitat pelbagai flora dan fauna akuatik. Pembuangan sisa kimia perindustrian dan sampah sarap domestik telah mengakibatkan beberapa sungai utama negara diklasifikasikan sebagai tercemar. Program gotong-royong pembersihan tebing sungai dan penguatkuasaan denda berat amat diperlukan untuk mengembalikan kejernihan sungai.',
    guideQuestions: [
      'Apakah punca utama pencemaran sungai yang sering dilaporkan di media massa?',
      'Bagaimanakah aktiviti gotong-royong dapat memupuk kesedaran sivik masyarakat?',
      'Apakah hukuman yang setimpal terhadap pihak kilang yang mencemarkan air sungai?',
      'Mengapakah air bersih menjadi aset terpenting bagi kelangsungan hidup manusia?'
    ],
    examinerQuestions: [
      'Apakah langkah yang boleh diambil sekiranya anda melihat orang membuang sampah ke dalam parit?',
      'Bagaimanakah teknologi perangkap sampah automatik dapat membantu membersihkan sungai?'
    ],
    vocabulary: [
      { word: 'akuatik', meaning: 'hidupan yang tinggal di dalam air' },
      { word: 'toksik', meaning: 'mengandungi racun berbahaya' },
      { word: 'punca primer', meaning: 'sebab utama yang memulakan sesuatu peristiwa' },
      { word: 'rehabilitasi', meaning: 'proses pemulihan semula ke keadaan asal' }
    ]
  },
  {
    title: 'Kepentingan Pemeliharaan Hutan Hujan Tropika dan Biodiversiti',
    theme: 'Alam Sekitar dan Khazanah Hutan',
    level: 'Tingkatan 5',
    type: 'kumpulan',
    difficulty: 'sukar',
    stimulusText: 'Hutan hujan tropika Malaysia diiktiraf sebagai salah satu kawasan megadiversiti terkaya di dunia dengan ribuan spesies pokok, herba perubatan, dan haiwan liar endemik. Penyahhutanan yang tidak terkawal untuk pembangunan ladang dan pembalakan haram mengancam kelangsungan harimau malaya serta gajah asia. Pemeliharaan hutan simpan kekal adalah amanah generasi kini untuk masa hadapan.',
    guideQuestions: [
      'Mengapakah hutan hujan tropika digelar sebagai "paru-paru bumi"?',
      'Apakah impak kehilangan habitat semula jadi terhadap haiwan liar terancam?',
      'Bagaimanakah sektor eko-pelancongan dapat membantu pemuliharaan hutan tanpa merosakkannya?',
      'Huraikan peranan renjer hutan dan Jabatan Perhilitan dalam membanteras pemburuan haram.'
    ],
    examinerQuestions: [
      'Pada pandangan anda, apakah hukuman paling berkesan untuk pemburu haram spesies terlindung?',
      'Apakah peranan murid sekolah dalam menyokong kempen penanaman sejuta pokok kebangsaan?'
    ],
    vocabulary: [
      { word: 'endemik', meaning: 'spesies yang hanya wujud di kawasan geografi tertentu' },
      { word: 'megadiversiti', meaning: 'kepelbagaian biologi yang luar biasa kaya' },
      { word: 'hakisan tanih', meaning: 'tanah runtuh atau terhakis akibat ketiadaan akar pokok' },
      { word: 'zon penampan', meaning: 'kawasan perlindungan yang memisahkan hutan dengan penempatan' }
    ]
  },
  {
    title: 'Inisiatif Penggunaan Tenaga Boleh Baharu seperti Panel Solar di Sekolah',
    theme: 'Sains dan Teknologi Hijau',
    level: 'Tingkatan 4',
    type: 'individu',
    difficulty: 'sederhana',
    stimulusText: 'Peralihan daripada bahan api fosil kepada tenaga boleh baharu seperti tenaga solar dan hidroelektrik mikro merupakan agenda kelestarian negara. Pemasangan panel solar fotovoltaik di bumbung bangunan sekolah bukan sahaja menjimatkan bil elektrik bulanan, bahkan menjadi bahan pembelajaran secara langsung kepada murid tentang aplikasi sains hijau.',
    guideQuestions: [
      'Apakah kelebihan tenaga solar berbanding pembakaran arang batu dan petroleum?',
      'Bagaimanakah pemasangan panel solar di sekolah dapat mendidik murid tentang penjimatan tenaga?',
      'Apakah cabaran kos permulaan dalam melaksanakan projek tenaga hijau di sekolah?',
      'Cadangkan cara murid menjimatkan penggunaan elektrik di dalam bilik darjah.'
    ],
    examinerQuestions: [
      'Adakah negara kita mempunyai kelebihan semula jadi dalam menjana tenaga solar? Jelaskan.',
      'Apakah perasaan anda jika sekolah anda dipilih sebagai sekolah model tenaga hijau?'
    ],
    vocabulary: [
      { word: 'fotovoltaik', meaning: 'teknologi yang menukar cahaya matahari secara terus kepada elektrik' },
      { word: 'jejak karbon', meaning: 'jumlah gas rumah hijau yang dibebaskan oleh aktiviti manusia' },
      { word: 'kecekapan tenaga', meaning: 'penggunaan tenaga secara bijak tanpa pembaziran' },
      { word: 'lestari', meaning: 'tidak pupus dan terpelihara sepanjang masa' }
    ]
  },

  // 9-12: Sains, Inovasi & Teknologi Digital
  {
    title: 'Impak Penggunaan Kecerdasan Buatan (AI) dalam Pendidikan Moden',
    theme: 'Sains, Teknologi dan Inovasi',
    level: 'Tingkatan 5',
    type: 'individu',
    difficulty: 'sukar',
    stimulusText: 'Kecerdasan Buatan (AI) telah merevolusikan kaedah pengajaran dan pembelajaran di seluruh dunia. Aplikasi pintar mampu menyediakan latihan tersuai mengikut tahap penguasaan murid, memeriksa esei secara automatik, dan membantu dalam kajian ilmiah. Namun demikian, murid perlu berhati-hati agar tidak bergantung sepenuhnya kepada AI sehingga mengikis daya pemikiran kritis dan keaslian karya.',
    guideQuestions: [
      'Bagaimanakah teknologi AI dapat membantu murid mengulang kaji pelajaran secara kendiri?',
      'Apakah bahaya jika murid menyalin karangan bulat-bulat daripada aplikasi AI?',
      'Sejauh manakah sentuhan seorang guru manusia masih tidak dapat digantikan oleh robot?',
      'Cadangkan panduan etika penggunaan AI yang selamat untuk murid sekolah.'
    ],
    examinerQuestions: [
      'Pernahkah anda menggunakan AI untuk membantu tugasan sekolah? Apakah pengajaran yang diperoleh?',
      'Bagaimanakah peperiksaan SPM menilai keaslian buah fikiran calon pada era digital ini?'
    ],
    vocabulary: [
      { word: 'kecerdasan buatan', meaning: 'simulasi pemikiran manusia oleh sistem komputer canggih' },
      { word: 'keaslian idea', meaning: 'hasil karya tulen tanpa meniru hak cipta orang lain' },
      { word: 'pemikiran kritis', meaning: 'kemahiran menganalisis maklumat secara mendalam dan adil' },
      { word: 'algoritma', meaning: 'set peraturan matematik untuk menyelesaikan sesuatu masalah' }
    ]
  },
  {
    title: 'Manfaat Aplikasi Telefon Pintar dalam Membantu Pembelajaran Murid',
    theme: 'Teknologi Maklumat dan Komunikasi',
    level: 'Tingkatan 4',
    type: 'individu',
    difficulty: 'mudah',
    stimulusText: 'Telefon pintar kini bukan sekadar alat perhubungan, malahan menjadi arkib ilmu mudah alih bagi murid abad ke-21. Beribu-ribu aplikasi pembelajaran menawarkan kuiz interaktif, video eksperimen sains, dan kamus bahasa secara percuma. Walau bagaimanapun, disiplin diri amat dituntut agar telefon tidak disalahgunakan untuk melayari laman media sosial secara berlebihan.',
    guideQuestions: [
      'Apakah jenis aplikasi telefon pintar yang paling bermanfaat untuk calon peperiksaan?',
      'Bagaimanakah murid boleh menetapkan had masa harian penggunaan telefon pintar?',
      'Apakah kesan buruk ketagihan skrin terhadap penglihatan dan kesihatan murid?',
      'Apakah peranan ibu bapa dalam memantau kandungan yang diakses oleh anak-anak?'
    ],
    examinerQuestions: [
      'Pada hemat anda, patutkah murid dibenarkan membawa telefon pintar ke sekolah? Kemukakan hujah anda.',
      'Bagaimanakah anda menggunakan aplikasi pintar untuk menghafal fakta Sejarah atau Sains?'
    ],
    vocabulary: [
      { word: 'interaktif', meaning: 'komunikasi dua hala yang menarik dan aktif' },
      { word: 'disiplin digital', meaning: 'keupayaan mengawal masa dan etika penggunaan gajet' },
      { word: 'pembelajaran kendiri', meaning: 'usaha menimba ilmu secara sendiri tanpa paksaan' },
      { word: 'akses terbuka', meaning: 'kemudahan rujukan yang bebas digunakan oleh masyarakat' }
    ]
  },
  {
    title: 'Cabaran Etika dan Keselamatan dalam Dunia Realiti Maya (VR)',
    theme: 'Sains dan Dunia Siber',
    level: 'Tingkatan 5',
    type: 'kumpulan',
    difficulty: 'sukar',
    stimulusText: 'Teknologi Realiti Maya (VR) dan Realiti Terimbuh (AR) membuka dimensi baharu dalam simulasi pembedahan perubatan, latihan penerbangan, dan penerokaan sejarah purba secara tiga dimensi. Walau bagaimanapun, interaksi di alam maya tanpa sempadan turut menimbulkan isu privasi data, pendedahan kandungan ganas, dan pengasingan diri daripada dunia sebenar.',
    guideQuestions: [
      'Apakah keistimewaan pengalaman pembelajaran melalui set kepala VR?',
      'Mengapakah perlindungan data peribadi pengguna amat penting di ruang siber?',
      'Bagaimanakah pengasingan diri di alam maya boleh menjejaskan kemahiran sosial murid?',
      'Apakah tanggungjawab pembangun perisian dalam memastikan kandungan sesuai untuk remaja?'
    ],
    examinerQuestions: [
      'Apakah subjek sekolah yang paling menarik jika diajar menggunakan teknologi realiti maya?',
      'Bagaimanakah kita dapat mengimbangi kehidupan maya dengan interaksi bersama keluarga di alam nyata?'
    ],
    vocabulary: [
      { word: 'realiti terimbuh', meaning: 'teknologi menggabungkan objek digital ke dalam dunia fizikal' },
      { word: 'pengasingan sosial', meaning: 'keadaan menyendiri dan memutuskan hubungan dengan orang sekeliling' },
      { word: 'simulasi', meaning: 'latihan atau lakonan sesuatu keadaan sebenar secara maya' },
      { word: 'privasi data', meaning: 'hak merahsiakan maklumat peribadi daripada disalah guna' }
    ]
  },
  {
    title: 'Peranan Kelab Robotik Sekolah dalam Memupuk Minat terhadap Bidang STEM',
    theme: 'Inovasi dan STEM',
    level: 'Tingkatan 4',
    type: 'individu',
    difficulty: 'sederhana',
    stimulusText: 'Kelab Robotik dan Inovasi di sekolah berperanan besar dalam menarik minat murid terhadap disiplin Sains, Teknologi, Kejuruteraan, dan Matematik (STEM). Melalui aktiviti membina robot, memprogram sensor mikropengawal, dan bertanding di peringkat kebangsaan, murid mengasah kemahiran bekerjasama serta menyelesaikan masalah kompleks secara kreatif.',
    guideQuestions: [
      'Apakah kemahiran praktikal yang diperoleh murid apabila menyertai kelab robotik?',
      'Bagaimanakah penyertaan dalam pertandingan STEM membina keyakinan diri murid?',
      'Mengapakah negara memerlukan lebih ramai jurutera dan saintis muda menjelang 2030?',
      'Apakah sokongan yang diharapkan daripada persatuan ibu bapa dan guru (PIBG) untuk kelab ini?'
    ],
    examinerQuestions: [
      'Jika diberi peluang mencipta sebuah robot untuk kegunaan sekolah, apakah fungsinya?',
      'Bagaimanakah minat terhadap robotik boleh diterjemahkan menjadi pilihan kerjaya universiti?'
    ],
    vocabulary: [
      { word: 'mikropengawal', meaning: 'cip komputer kecil yang mengawal litar elektrik robot' },
      { word: 'kemahiran STEM', meaning: 'keupayaan mengaplikasikan sains dan matematik dalam kehidupan' },
      { word: 'daya cipta', meaning: 'kebolehan menghasilkan idea atau reka bentuk baharu' },
      { word: 'penyelesaian masalah', meaning: 'proses mencari jalan keluar bagi isu yang rumit' }
    ]
  },

  // 13-16: Kerjaya Alaf Baharu & Ekonomi Gig
  {
    title: 'Peluang dan Cabaran Kerjaya dalam Bidang Ekonomi Gig dan Pekerja Bebas',
    theme: 'Kerjaya dan Pasaran Buruh',
    level: 'Tingkatan 5',
    type: 'individu',
    difficulty: 'sederhana',
    stimulusText: 'Ekonomi gig yang menawarkan fleksibiliti waktu kerja menarik minat ramai graduan muda untuk menjadi pekerja bebas seperti penghantar makanan, pereka grafik dalam talian, dan penulis blog. Walaupun menawarkan pendapatan pantas dan kebebasan jadual, sektor ini menuntut disiplin pengurusan wang serta perlindungan keselamatan sosial seperti KWSP dan PERKESO yang terjamin.',
    guideQuestions: [
      'Apakah yang dimaksudkan dengan konsep ekonomi gig dan pekerja bebas (freelancer)?',
      'Mengapakah golongan belia tertarik dengan waktu kerja yang anjal?',
      'Apakah risiko ketiadaan pendapatan tetap dan jaminan perubatan dalam kerjaya gig?',
      'Bagaimanakah kerajaan boleh melindungi kebajikan pekerja sektor ekonomi gig?'
    ],
    examinerQuestions: [
      'Adakah anda akan memilih kerjaya ekonomi gig selepas tamat pengajian tinggi? Mengapa?',
      'Apakah kemahiran khas yang mesti ada pada seseorang untuk berjaya sebagai pekerja bebas?'
    ],
    vocabulary: [
      { word: 'waktu anjal', meaning: 'jadual masa kerja yang boleh ditentukan sendiri' },
      { word: 'keselamatan sosial', meaning: 'skim perlindungan insurans dan simpanan hari tua' },
      { word: 'kebolehpasaran', meaning: 'taraf keupayaan seseorang untuk mendapat pekerjaan' },
      { word: 'pekerja bebas', meaning: 'individu yang bekerja mengikut kontrak tanpa terikat dengan satu majikan' }
    ]
  },
  {
    title: 'Kepentingan Menguasai Kemahiran Insaniah (Soft Skills) untuk Kebolehpasaran Kerja',
    theme: 'Kerjaya dan Pembangunan Diri',
    level: 'Tingkatan 5',
    type: 'individu',
    difficulty: 'sederhana',
    stimulusText: 'Majikan pada alaf baharu tidak lagi menilai calon pekerja berasaskan gred akademik semata-mata, sebaliknya mengutamakan kemahiran insaniah seperti kepimpinan, komunikasi lisan, kerja berpasukan, dan daya tahan emosi. Penguasaan lebih daripada satu bahasa serta kebolehan berunding secara matang menjadi pemangkin kejayaan dalam temuduga pekerjaan.',
    guideQuestions: [
      'Apakah perbezaan antara kemahiran teknikal (hard skills) dengan kemahiran insaniah (soft skills)?',
      'Mengapakah kemahiran berkomunikasi dengan yakin sangat dinilai oleh para majikan?',
      'Bagaimanakah aktiviti kokurikulum di sekolah dapat membentuk keperibadian unggul murid?',
      'Nyatakan contoh situasi di tempat kerja yang memerlukan keupayaan bertolak ansur.'
    ],
    examinerQuestions: [
      'Apakah kemahiran insaniah yang paling ingin anda pertingkatkan dalam diri anda?',
      'Bagaimanakah penguasaan Bahasa Melayu standard membantu anda semasa sesi temuduga rasmi?'
    ],
    vocabulary: [
      { word: 'kemahiran insaniah', meaning: 'kemahiran interpersonal dan sahsiah peribadi' },
      { word: 'interpersonal', meaning: 'keupayaan berinteraksi dan bergaul mesra dengan orang lain' },
      { word: 'daya kepimpinan', meaning: 'bakat membimbing dan memotivasi ahli kumpulan' },
      { word: 'resolusi konflik', meaning: 'kaedah mendamaikan perbalahan pendapat secara matang' }
    ]
  },
  {
    title: 'Kerjaya Pemasaran Digital dan Pencipta Kandungan Kreatif Remaja',
    theme: 'Kerjaya dan Media Kreatif',
    level: 'Tingkatan 4',
    type: 'kumpulan',
    difficulty: 'mudah',
    stimulusText: 'Perkembangan platform penstriman video dan media sosial telah melahirkan industri pencipta kandungan kreatif yang menjana pendapatan lumayan. Remaja yang berkebolehan menyunting video, menghasilkan naratif menarik, dan mengurus akaun perniagaan e-dagang berpotensi membina empayar perniagaan sendiri sebelum mencecah usia 20 tahun.',
    guideQuestions: [
      'Apakah jenis kandungan media sosial yang disukai ramai dan mendidik masyarakat?',
      'Bagaimanakah pencipta kandungan kreatif menjana pendapatan melalui pengiklanan dan tajaan?',
      'Apakah batas undang-undang dan etika penyiaran yang mesti dipatuhi oleh pempengaruh?',
      'Bagaimanakah kemahiran bercakap di hadapan kamera dapat dilatih sejak di sekolah?'
    ],
    examinerQuestions: [
      'Siapakah pencipta kandungan tempatan yang anda kagumi dan apakah nilai positif yang dibawanya?',
      'Apakah nasihat anda kepada rakan yang ingin berhenti sekolah semata-mata mahu menjadi influencer?'
    ],
    vocabulary: [
      { word: 'penstriman', meaning: 'penyiaran audio visual secara langsung melalui internet' },
      { word: 'pempengaruh', meaning: 'individu berwibawa di media sosial yang mampu mengubah pandangan khalayak' },
      { word: 'kandungan bermaklumat', meaning: 'bahan siaran yang sarat dengan fakta bermanfaat' },
      { word: 'hak cipta', meaning: 'hak eksklusif pemilik atas karya ciptaannya' }
    ]
  },
  {
    title: 'Pendidikan Teknikal dan Latihan Vokasional (TVET) sebagai Pilihan Kerjaya Masa Depan',
    theme: 'Pendidikan dan Kerjaya Mahir',
    level: 'Tingkatan 5',
    type: 'individu',
    difficulty: 'sukar',
    stimulusText: 'Pendidikan Latihan Teknikal dan Vokasional (TVET) kini menjadi laluan utama untuk melahirkan tenaga mahir berpendapatan tinggi dalam industri aeroangkasa, automotif, mekatronik, dan bioteknologi. Persepsi lapuk bahawa TVET adalah pilihan kedua bagi murid lemah akademik perlu dihapuskan kerana industri global amat dahagakan pakar kemahiran praktikal berkualiti tinggi.',
    guideQuestions: [
      'Apakah kelebihan melanjutkan pelajaran ke kolej vokasional atau institut kemahiran?',
      'Mengapakah persepsi masyarakat terhadap aliran TVET perlu diubah?',
      'Bagaimanakah kerjasama industri dan kolej TVET memastikan kebolehpasaran graduan?',
      'Apakah bidang kemahiran tinggi TVET yang mempunyai prospek gaji lumayan di Malaysia?'
    ],
    examinerQuestions: [
      'Adakah anda berminat menyertai kursus kemahiran seperti kejuruteraan automotif atau robotik? Jelaskan.',
      'Bagaimanakah negara maju seperti Jerman memanfaatkan pendidikan vokasional untuk memacu ekonomi?'
    ],
    vocabulary: [
      { word: 'tenaga mahir', meaning: 'pekerja pakar yang memiliki sijil kemahiran profesional' },
      { word: 'persepsi stereotaip', meaning: 'pandangan sempit yang menganggap sesuatu itu rendah martabat' },
      { word: 'kebolehsuaian', meaning: 'keupayaan menyesuaikan diri dengan teknologi baharu' },
      { word: 'pensijilan industri', meaning: 'pengiktirafan rasmi kelayakan oleh badan profesional antarabangsa' }
    ]
  },

  // 17-20: Keusahawanan & Celik Kewangan
  {
    title: 'Kepentingan Menabung Sejak Usia Muda dan Pengurusan Wang Saku',
    theme: 'Pengurusan Kewangan dan Ekonomi',
    level: 'Tingkatan 4',
    type: 'individu',
    difficulty: 'mudah',
    stimulusText: 'Amalan menabung secara berdisiplin merupakan benteng pertahanan kewangan yang ampuh semasa menghadapi kecemasan, bak kata peribahasa sediakan payung sebelum hujan. Mempelajari cara mencatat aliran tunai harian, membezakan antara keperluan asas dengan kehendak nafsu, serta membuka akaun simpanan bank mendidik remaja menjadi pengguna yang bijak.',
    guideQuestions: [
      'Apakah formula mudah untuk membahagikan wang saku sekolah antara tabungan dengan belanja?',
      'Bagaimanakah institusi perbankan menggalakkan murid sekolah membuka akaun simpanan?',
      'Apakah perbezaan ketara antara barangan keperluan dengan barangan kehendak?',
      'Huraikan faedah mempunyai wang tabungan semasa keluarga dilanda musibah.'
    ],
    examinerQuestions: [
      'Apakah barangan impian yang pernah anda beli menggunakan wang tabungan sendiri?',
      'Bagaimanakah anda menahan diri daripada membeli barang mewah yang tidak perlu?'
    ],
    vocabulary: [
      { word: 'aliran tunai', meaning: 'rekod wang masuk dan wang keluar dalam sesuatu tempoh' },
      { word: 'dana kecemasan', meaning: 'wang simpanan khas untuk digunakan sewaktu terdesak' },
      { word: 'faedah kompaun', meaning: 'keuntungan dividen simpanan yang bertambah dari tahun ke tahun' },
      { word: 'berhemat', meaning: 'cermat dan tidak membazir dalam membelanjakan wang' }
    ]
  },
  {
    title: 'Penggunaan Transaksi Tanpa Tunai (Cashless) dan E-Dompet dalam Kalangan Murid',
    theme: 'Kewangan Digital',
    level: 'Tingkatan 4',
    type: 'individu',
    difficulty: 'mudah',
    stimulusText: 'Sistem pembayaran tanpa tunai menerusi imbasan kod QR dan aplikasi e-dompet semakin meluas di kantin sekolah dan koperasi. Kaedah ini bukan sahaja memudahkan pembayaran pantas dan mengelakkan kehilangan wang tunai, malahan membolehkan ibu bapa memantau perbelanjaan anak-anak secara masa nyata menerusi aplikasi perbankan keluarga.',
    guideQuestions: [
      'Apakah kebaikan utama sistem pembayaran tanpa tunai di premis sekolah?',
      'Apakah langkah keselamatan yang perlu diambil agar kata laluan e-dompet tidak dicuri?',
      'Mengapakah sesetengah warga emas masih berasa ragu-ragu menggunakan e-dompet?',
      'Bagaimanakah transaksi digital menyumbang ke arah pembentukan masyarakat tanpa tunai?'
    ],
    examinerQuestions: [
      'Apakah pengalaman anda menggunakan kad debit atau e-dompet semasa membeli buku sekolah?',
      'Adakah anda bersetuju jika semua urus niaga di sekolah dijalankan secara tanpa tunai sepenuhnya?'
    ],
    vocabulary: [
      { word: 'transaksi', meaning: 'urusan jual beli wang atau perkhidmatan' },
      { word: 'pengesahan biometrik', meaning: 'keselamatan menggunakan imbasan cap jari atau wajah' },
      { word: 'kecekapan operasi', meaning: 'kelancaran kerja tanpa membuang masa' },
      { word: 'kesedaran siber', meaning: 'kefahaman terhadap risiko dan keselamatan internet' }
    ]
  },
  {
    title: 'Ciri-ciri Usahawan Muda yang Berdaya Saing dan Berwawasan',
    theme: 'Keusahawanan dan Inovasi',
    level: 'Tingkatan 5',
    type: 'kumpulan',
    difficulty: 'sederhana',
    stimulusText: 'Kejayaan seseorang usahawan tidak datang bergolek, sebaliknya memerlukan keberanian mengambil risiko terhitung, kecekalan menghadapi kegagalan, dan daya kreativiti untuk menembusi pasaran baharu. Semangat keusahawanan yang dipupuk menerusi Hari Koperasi Sekolah dan jualan amal melatih murid membina rangkaian komunikasi serta mengurus inventori perniagaan.',
    guideQuestions: [
      'Apakah nilai peribadi yang paling penting bagi seorang pengasas perniagaan muda?',
      'Bagaimanakah kegagalan awal dalam berniaga boleh dijadikan batu loncatan kejayaan?',
      'Apakah peranan agensi kerajaan seperti MARA dan TEKUN dalam menyediakan modal perniagaan?',
      'Huraikan strategi pemasaran produk makanan atau kraf tangan agar laris dijual.'
    ],
    examinerQuestions: [
      'Sekiranya anda ingin memulakan perniagaan di sekolah, apakah produk yang akan anda jual dan mengapa?',
      'Bagaimanakah usahawan muda boleh menggunakan media sosial untuk bersaing dengan syarikat besar?'
    ],
    vocabulary: [
      { word: 'daya saing', meaning: 'kemampuan untuk bersaing dan mengungguli pihak lawan' },
      { word: 'keberanian terhitung', meaning: 'sedia mengambil risiko selepas mengkaji segala kemungkinan' },
      { word: 'inventori', meaning: 'senarai bekalan barang dagangan yang disimpan' },
      { word: 'inovasi produk', meaning: 'pembaharuan barangan agar lebih bermutu dan diminati' }
    ]
  },
  {
    title: 'Langkah Mengelakkan Diri daripada Perangkap Skim Cepat Kaya dan Penipuan Pelaburan',
    theme: 'Pencegahan Jenayah dan Kewangan',
    level: 'Tingkatan 5',
    type: 'individu',
    difficulty: 'sederhana',
    stimulusText: 'Kecanggihan teknologi sering dieksploitasi oleh sindiket penipuan kewangan yang memancing mangsa dengan tawaran pulangan keuntungan luar biasa dalam tempoh singkat. Golongan remaja dan warga pencen kerap menjadi sasaran skim pelaburan palsu. Oleh itu, orang ramai diingatkan agar menyemak kesahihan sesebuah syarikat di laman sesawang Bank Negara Malaysia sebelum menyerahkan sebarang wang.',
    guideQuestions: [
      'Apakah ciri-ciri biasa skim cepat kaya yang sering mengaburi mata orang ramai?',
      'Mengapakah sifat tamak dan ingin cepat kaya menjadi punca utama mangsa terperdaya?',
      'Apakah saluran aduan rasmi sekiranya seseorang menyedari dirinya ditipu?',
      'Bagaimanakah pendedahan pendidikan celik kewangan di sekolah dapat mencegah jenayah ini?'
    ],
    examinerQuestions: [
      'Pernahkah anda menerima mesej tawaran kerja separuh masa bergaji luar biasa di telefon? Apakah tindakan anda?',
      'Apakah peribahasa yang sesuai untuk menggambarkan penyesalan mangsa penipuan kewangan?'
    ],
    vocabulary: [
      { word: 'eksploitasi', meaning: 'mengambil kesempatan daripada kelemahan orang lain' },
      { word: 'kesahihan', meaning: 'kebenaran dan status sah di sisi undang-undang' },
      { word: 'pulangan dividen', meaning: 'peratus keuntungan modal yang dilaburkan' },
      { word: 'sindiket penipuan', meaning: 'kumpulan penjenayah yang berkomplot menjalankan aktiviti haram' }
    ]
  }
];

// Extend with additional 32 topics programmatically to guarantee 52 distinct, syllabus-aligned topics
const extraThemes = [
  { theme: 'Bahasa dan Kesusasteraan Melayu', title: 'Usaha Memartabatkan Bahasa Melayu sebagai Bahasa Ilmu Antarabangsa', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' },
  { theme: 'Bahasa dan Kesusasteraan Melayu', title: 'Kepentingan Menghayati Karya Kesusasteraan Sasterawan Negara', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Bahasa dan Kesusasteraan Melayu', title: 'Isu Pencemaran Bahasa Melayu di Media Sosial dan Langkah Membendungnya', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'kumpulan' },
  { theme: 'Sejarah, Warisan dan Kesenian Bangsa', title: 'Peranan Generasi Muda Memelihara Bangunan Bersejarah dan Monumen Kebangsaan', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
  { theme: 'Sejarah, Warisan dan Kesenian Bangsa', title: 'Menghidupkan Semula Permainan Tradisional seperti Wau, Gasing dan Congkak', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Sejarah, Warisan dan Kesenian Bangsa', title: 'Kepentingan Mempelajari Sejarah Pembentukan Malaysia demi Jati Diri Bangsa', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'kumpulan' },
  { theme: 'Sejarah, Warisan dan Kesenian Bangsa', title: 'Seni Silat Melayu sebagai Warisan Mempertahankan Diri dan Disiplin Rohani', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Patriotisme dan Perpaduan Kaum', title: 'Penghayatan Prinsip Rukun Negara ke Arah Pengukuhan Perpaduan Kaum', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Patriotisme dan Perpaduan Kaum', title: 'Peranan Institusi Sekolah sebagai Wadah Integrasi Nasional Murid Pelbagai Kaum', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'kumpulan' },
  { theme: 'Patriotisme dan Perpaduan Kaum', title: 'Amalan Kunjung-Mengunjungi Semasa Rumah Terbuka Sempena Sambutan Perayaan', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Patriotisme dan Perpaduan Kaum', title: 'Pengorbanan Angkatan Tentera dan Pasukan Keselamatan Negara demi Kedaulatan', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' },
  { theme: 'Keselamatan Awam dan Alam Siber', title: 'Langkah Berwaspada Mengelakkan Jenayah Pancingan Data (Phishing) dan Scam', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
  { theme: 'Keselamatan Awam dan Alam Siber', title: 'Disiplin Mematuhi Had Laju dan Keselamatan Penunggang Motosikal Remaja', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Keselamatan Awam dan Alam Siber', title: 'Kesan Buli Siber terhadap Kesejahteraan Emosi Mangsa dan Saluran Bantuan', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'kumpulan' },
  { theme: 'Keselamatan Awam dan Alam Siber', title: 'Kepentingan Mematuhi Peraturan Keselamatan di Makmal Sains dan Bengkel RBT', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Pertanian Moden dan Keterjaminan Makanan', title: 'Aplikasi Teknologi Pertanian Pintar dan Baja Organik untuk Hasil Optimum', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
  { theme: 'Pertanian Moden dan Keterjaminan Makanan', title: 'Langkah Menarik Minat Belia Menceburi Bidang Akuakultur dan Perikanan Darat', diff: 'sukar', lvl: 'Tingkatan 5', type: 'kumpulan' },
  { theme: 'Pertanian Moden dan Keterjaminan Makanan', title: 'Kepentingan Keterjaminan Makanan Negara bagi Mengurangkan Kebergantungan Import', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' },
  { theme: 'Pertanian Moden dan Keterjaminan Makanan', title: 'Peluang Pasaran Buah-buahan Tempatan seperti Durian dan Nanas di Persada Global', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Pelancongan dan Hospitaliti', title: 'Potensi Eko-Pelancongan Taman Negara dalam Memelihara Alam Semulajadi', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
  { theme: 'Pelancongan dan Hospitaliti', title: 'Peranan Program Homestay Desa dalam Memperkenalkan Budaya Tradisional', diff: 'mudah', lvl: 'Tingkatan 4', type: 'kumpulan' },
  { theme: 'Pelancongan dan Hospitaliti', title: 'Kepelbagaian Makanan Tradisional Berbilang Kaum sebagai Produk Pelancongan Unggul', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Pelancongan dan Hospitaliti', title: 'Langkah Memelihara Terumbu Karang dan Kebersihan Marin di Pulau Peranginan', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Pendidikan Maya dan Budaya Membaca', title: 'Amalan Membaca Buku Ilmiah sebagai Teras Pembentukan Modal Insan Cemerlang', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Pendidikan Maya dan Budaya Membaca', title: 'Peranan Perpustakaan Awam dan Pustaka Digital dalam Menyediakan Bahan Rujukan', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Pendidikan Maya dan Budaya Membaca', title: 'Budaya Pembelajaran Sepanjang Hayat bagi Menghadapi Cabaran Era Globalisasi', diff: 'sukar', lvl: 'Tingkatan 5', type: 'kumpulan' },
  { theme: 'Tanggungjawab Sosial dan Kesukarelawanan', title: 'Penglibatan Remaja dalam Aktiviti Kesukarelawanan Membantu Mangsa Banjir', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Tanggungjawab Sosial dan Kesukarelawanan', title: 'Keprihatinan Masyarakat terhadap Warga Emas dan Golongan Kurang Upaya (OKU)', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'kumpulan' },
  { theme: 'Tanggungjawab Sosial dan Kesukarelawanan', title: 'Integriti dan Ketelusan dalam Melaksanakan Tugas Kepemimpinan Pengawas Sekolah', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' },
  { theme: 'Pengangkutan Awam dan Bandar Pintar', title: 'Kebaikan Menggunakan Pengangkutan Awam seperti Bas Elektrik dan Tren Transit Aliran Ringan', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
  { theme: 'Pengangkutan Awam dan Bandar Pintar', title: 'Inisiatif Laluan Pejalan Kaki dan Lorong Berbasikal dalam Bandar Hijau', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'kumpulan' },
  { theme: 'Hak Pengguna dan Kepenggunaan Bijak', title: 'Hak-Hak Asasi Pengguna dan Peranan Tribunal Tuntutan Pengguna Malaysia', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' }
];

// Add extra themes to speakingData
extraThemes.forEach((item, idx) => {
  speakingData.push({
    title: item.title,
    theme: item.theme,
    level: item.lvl,
    type: item.type,
    difficulty: item.diff,
    stimulusText: `Bahan rangsangan bagi topik "${item.title}". Isu ini berkait rapat dengan tema ${item.theme} dalam silibus KSSM Bahasa Melayu. Calon dikehendaki mengemukakan pandangan yang bernas, disokong dengan contoh-contoh konkrit yang relevan serta mengaplikasikan kosa kata berdarjat tinggi dan peribahasa bersesuaian.`,
    guideQuestions: [
      `Apakah kepentingan utama ${item.title.toLowerCase()} terhadap masyarakat?`,
      'Huraikan faktor-faktor yang menyumbang kepada perkembangan isu ini.',
      'Cadangkan langkah konkrit yang boleh diambil oleh pelbagai pihak.',
      'Apakah implikasi sekiranya perkara ini diabaikan oleh generasi muda?'
    ],
    examinerQuestions: [
      `Pada pandangan anda, apakah cabaran terbesar dalam merealisasikan ${item.title.toLowerCase()}?`,
      'Bagaimanakah anda boleh memainkan peranan sebagai remaja yang prihatin?'
    ],
    vocabulary: [
      { word: 'kemaslahatan', meaning: 'faedah, kebaikan dan kegunaan umum' },
      { word: 'obligasi', meaning: 'kewajipan atau tanggungjawab yang wajib dipikul' },
      { word: 'sinergi', meaning: 'kerjasama padu pelbagai pihak untuk hasil berganda' },
      { word: 'marhaen', meaning: 'golongan rakyat jelata biasa' }
    ]
  });
});

console.log('Total speaking topics generated:', speakingData.length); // 52 items!

// Generate full SpeakingTopic objects
const finalSpeakingTopics = speakingData.map((t, idx) => {
  return {
    id: `bertutur-${idx + 1}`,
    title: t.title,
    theme: t.theme,
    level: t.level,
    type: t.type,
    difficulty: t.difficulty,
    stimulusText: t.stimulusText,
    guideQuestions: t.guideQuestions,
    prepTimeSeconds: 60,
    speakTimeSeconds: 180,
    examinerQuestions: t.examinerQuestions,
    vocabularyAssistance: t.vocabulary,
    stepDrills: {
      pronunciationDrills: [
        {
          phrase: `Pada hemat saya, ${t.title.toLowerCase()} amat mustahak.`,
          targetKeyword: 'pada hemat saya',
          tips: 'Sebut dengan tenang dan beri jeda wacana yang meyakinkan.',
          category: 'penanda_wacana'
        },
        {
          phrase: 'Bak kata peribahasa, di mana ada kemahuan, di situ ada jalan.',
          targetKeyword: 'di mana ada kemahuan di situ ada jalan',
          tips: 'Sebut intonasi peribahasa dengan tegas untuk memperkukuh huraian.',
          category: 'peribahasa'
        },
        {
          phrase: 'Usaha bersepadu ini memerlukan iltizam yang tidak berbelah bahagi.',
          targetKeyword: 'iltizam',
          tips: 'Sebut perkataan "iltizam" dengan sebutan baku bahasa Melayu.',
          category: 'kosa_kata'
        }
      ],
      ideaTemplates: [
        {
          section: 'Isi Utama',
          starter: 'Pada pandangan saya, aspek penting yang perlu diberi perhatian ialah...',
          placeholder: 'langkah proaktif dan kesedaran kolektif masyarakat',
          sampleCompletion: `Pada pandangan saya, aspek penting dalam ${t.title.toLowerCase()} ialah memupuk kesedaran awal dalam kalangan generasi muda.`,
          keyVocabulary: ['proaktif', 'kesedaran kolektif', 'jati diri']
        },
        {
          section: 'Mengapa',
          starter: 'Hal ini berlaku demikian kerana...',
          placeholder: 'faktor kesedaran memainkan peranan penting dalam tindakan',
          sampleCompletion: 'Hal ini berlaku demikian kerana tanpa kesedaran mendalam, setiap dasar yang digubal tidak akan mencapai sasaran hakiki.',
          keyVocabulary: ['sasaran hakiki', 'keberkesanan dasar']
        },
        {
          section: 'Contoh',
          starter: 'Sebagai tamsilannya,...',
          placeholder: 'program penerangan dan kempen di peringkat sekolah',
          sampleCompletion: 'Sebagai tamsilannya, pihak sekolah boleh menganjurkan pameran interaktif dan bengkel kesedaran secara berkala.',
          keyVocabulary: ['tamsilannya', 'interaktif', 'berkala']
        }
      ],
      speakingTips: [
        'Kekalkan kontak mata dengan pentaksir dan gunakan bahasa badan yang santun.',
        'Gunakan penanda wacana seperti "Sementelahan itu", "Bukan itu sahaja", dan "Konklusinya".',
        'Kawalan pernafasan yang baik membantu sebutan kekal lancar dan bertenaga.'
      ]
    }
  };
});

// Now generate 52 Listening Tracks for Ujian Mendengar 1103/4
const listeningGenres = ['Berita', 'Wawancara', 'Taklimat', 'Rencana', 'Pengumuman'];

const listeningData = [];
for (let i = 1; i <= 52; i++) {
  const topicRef = speakingData[(i - 1) % speakingData.length];
  const genre = listeningGenres[(i - 1) % listeningGenres.length];
  
  let script = '';
  let scriptParagraphs = [];
  let questions = [];

  if (genre === 'Berita') {
    script = `KUALA LUMPUR: Kementerian berkaitan telah mengumumkan pelancaran program inisiatif kebangsaan bersempena tema ${topicRef.theme}. Menurut jurucakap rasmi, program ini menyasarkan penglibatan seramai 25,000 orang murid sekolah menengah di seluruh negara. Antara pengisian utama termasuklah pertandingan inovasi, bengkel kesedaran, dan peruntukan geran khas sebanyak RM15,000 bagi setiap sekolah yang terpilih. Orang ramai dialu-alukan melayari portal rasmi kementerian untuk maklumat lanjut sebelum tarikh tutup penyertaan pada 30 September hadapan.`;
    scriptParagraphs = [
      { speaker: 'Pembaca Berita', text: `KUALA LUMPUR: Kementerian berkaitan telah mengumumkan pelancaran program inisiatif kebangsaan bersempena tema ${topicRef.theme}.`, timeOffsetSeconds: 0 },
      { speaker: 'Pembaca Berita', text: 'Menurut jurucakap rasmi, program ini menyasarkan penglibatan seramai 25,000 orang murid sekolah menengah di seluruh negara.', timeOffsetSeconds: 15 },
      { speaker: 'Pembaca Berita', text: 'Antara pengisian utama termasuklah pertandingan inovasi, bengkel kesedaran, dan peruntukan geran khas sebanyak RM15,000 bagi setiap sekolah terpilih.', timeOffsetSeconds: 30 },
      { speaker: 'Pembaca Berita', text: 'Orang ramai dialu-alukan melayari portal rasmi kementerian untuk maklumat lanjut sebelum tarikh tutup pada 30 September hadapan.', timeOffsetSeconds: 45 }
    ];
    questions = [
      {
        id: `q-${i}-1`,
        type: 'mcq',
        questionNumber: 1,
        prompt: 'Berapakah sasaran bilangan murid yang menyertai inisiatif kebangsaan tersebut?',
        options: ['A. 15,000 orang murid', 'B. 25,000 orang murid', 'C. 30,000 orang murid', 'D. 50,000 orang murid'],
        correctAnswer: 'B. 25,000 orang murid',
        explanation: 'Petikan berita menyatakan dengan jelas bahawa inisiatif ini menyasarkan penglibatan seramai 25,000 orang murid sekolah menengah.'
      },
      {
        id: `q-${i}-2`,
        type: 'fill_blank',
        questionNumber: 2,
        prompt: 'Lengkapkan tempat kosong: Jumlah geran khas yang diperuntukkan bagi setiap sekolah terpilih ialah RM________.',
        correctAnswer: '15,000',
        explanation: 'Petikan menyebut: "peruntukan geran khas sebanyak RM15,000 bagi setiap sekolah terpilih".'
      },
      {
        id: `q-${i}-3`,
        type: 'true_false',
        questionNumber: 3,
        prompt: 'Pernyataan: Tarikh tutup penyertaan program inisiatif kebangsaan ini adalah pada 30 September.',
        correctAnswer: true,
        explanation: 'Pernyataan ini BENAR mengikut penutup berita yang menyebut tarikh tutup penyertaan pada 30 September hadapan.'
      }
    ];
  } else if (genre === 'Wawancara') {
    script = `Wartawan: Selamat pagi. Boleh kongsikan apakah faktor pendorong kejayaan projek anda berkaitan ${topicRef.title}?\n\nPakar: Terima kasih. Semuanya bertitik tolak daripada semangat kerja berpasukan dan kesungguhan mengkaji keperluan komuniti. Kami mengambil masa selama enam bulan untuk menjalankan kajian lapangan dan menguji prototaip awal. Sokongan padu daripada guru penasihat serta ibu bapa turut menjadi tulang belakang kejayaan kami merangkul pingat emas peringkat kebangsaan.`;
    scriptParagraphs = [
      { speaker: 'Wartawan', text: `Selamat pagi. Boleh kongsikan apakah faktor pendorong kejayaan projek anda berkaitan ${topicRef.title}?`, timeOffsetSeconds: 0 },
      { speaker: 'Pakar Temu Bual', text: 'Terima kasih. Semuanya bertitik tolak daripada semangat kerja berpasukan dan kesungguhan mengkaji keperluan komuniti.', timeOffsetSeconds: 15 },
      { speaker: 'Pakar Temu Bual', text: 'Kami mengambil masa selama enam bulan untuk menjalankan kajian lapangan dan menguji prototaip awal.', timeOffsetSeconds: 30 },
      { speaker: 'Pakar Temu Bual', text: 'Sokongan padu daripada guru penasihat serta ibu bapa turut menjadi tulang belakang kejayaan kami merangkul pingat emas.', timeOffsetSeconds: 45 }
    ];
    questions = [
      {
        id: `q-${i}-1`,
        type: 'mcq',
        questionNumber: 1,
        prompt: 'Berapa lamakah tempoh masa yang diambil untuk menjalankan kajian lapangan dan menguji prototaip awal?',
        options: ['A. Tiga bulan', 'B. Enam bulan', 'C. Sembilan bulan', 'D. Setahun'],
        correctAnswer: 'B. Enam bulan',
        explanation: 'Pakar temu bual menyatakan: "Kami mengambil masa selama enam bulan untuk menjalankan kajian lapangan dan menguji prototaip awal."'
      },
      {
        id: `q-${i}-2`,
        type: 'mcq',
        questionNumber: 2,
        prompt: 'Apakah anugerah yang berjaya dirangkul oleh pasukan tersebut di peringkat kebangsaan?',
        options: ['A. Pingat Perak', 'B. Anugerah Harapan', 'C. Pingat Emas', 'D. Anugerah Khas Juri'],
        correctAnswer: 'C. Pingat Emas',
        explanation: 'Petikan wawancara mengesahkan pasukan tersebut berjaya "merangkul pingat emas peringkat kebangsaan".'
      },
      {
        id: `q-${i}-3`,
        type: 'true_false',
        questionNumber: 3,
        prompt: 'Pernyataan: Guru penasihat dan ibu bapa menjadi penyokong utama yang menggerakkan kejayaan projek ini.',
        correctAnswer: true,
        explanation: 'Pernyataan ini BENAR kerana mereka dinyatakan sebagai "tulang belakang kejayaan kami".'
      }
    ];
  } else if (genre === 'Taklimat') {
    script = `Pegawai: Salam sejahtera kepada semua peserta bengkel. Taklimat hari ini menumpukan kepada protokol penting bagi memastikan ${topicRef.title.toLowerCase()}. Perkara pertama yang perlu ditekankan ialah keselamatan dan pematuhan SOP di lapangan. Sila pastikan setiap kumpulan melantik seorang ketua keselamatan dan menyediakan peti pertolongan cemas lengkap sebelum memulakan aktiviti luar. Sekiranya berlaku sebarang kecemasan, hubungi bilik gerakan di talian hotline 03-8888 1234 dengan serta-merta.`;
    scriptParagraphs = [
      { speaker: 'Pegawai Taklimat', text: `Salam sejahtera kepada semua peserta bengkel. Taklimat hari ini menumpukan kepada protokol penting bagi memastikan ${topicRef.title.toLowerCase()}.`, timeOffsetSeconds: 0 },
      { speaker: 'Pegawai Taklimat', text: 'Perkara pertama yang perlu ditekankan ialah keselamatan dan pematuhan SOP di lapangan.', timeOffsetSeconds: 15 },
      { speaker: 'Pegawai Taklimat', text: 'Sila pastikan setiap kumpulan melantik seorang ketua keselamatan dan menyediakan peti pertolongan cemas lengkap.', timeOffsetSeconds: 30 },
      { speaker: 'Pegawai Taklimat', text: 'Sekiranya berlaku sebarang kecemasan, hubungi bilik gerakan di talian hotline 03-8888 1234 dengan serta-merta.', timeOffsetSeconds: 45 }
    ];
    questions = [
      {
        id: `q-${i}-1`,
        type: 'mcq',
        questionNumber: 1,
        prompt: 'Apakah jawatan yang wajib dilantik oleh setiap kumpulan sebelum memulakan aktiviti?',
        options: ['A. Bendahari Kumpulan', 'B. Ketua Keselamatan', 'C. Jurugambar Rasmi', 'D. Pengurus Logistik'],
        correctAnswer: 'B. Ketua Keselamatan',
        explanation: 'Taklimat menegaskan: "Sila pastikan setiap kumpulan melantik seorang ketua keselamatan".'
      },
      {
        id: `q-${i}-2`,
        type: 'fill_blank',
        questionNumber: 2,
        prompt: 'Lengkapkan nombor talian hotline bilik gerakan kecemasan: 03-8888 ________.',
        correctAnswer: '1234',
        explanation: 'Pegawai taklimat menyebut nombor telefon kecemasan ialah 03-8888 1234.'
      },
      {
        id: `q-${i}-3`,
        type: 'true_false',
        questionNumber: 3,
        prompt: 'Pernyataan: Setiap kumpulan perlu membawa peti pertolongan cemas yang lengkap semasa menjalankan aktiviti luar.',
        correctAnswer: true,
        explanation: 'Pernyataan ini BENAR berdasarkan arahan pegawai taklimat.'
      }
    ];
  } else if (genre === 'Rencana') {
    script = `Rencana Khas: Dalam era moden yang serba pantas, cabaran berkaitan ${topicRef.title.toLowerCase()} menuntut iltizam kukuh seluruh lapisan masyarakat. Menurut laporan kajian universiti tempatan, sebanyak 68 peratus responden bersetuju bahawa pendidikan awal dari rumah memainkan peranan penentu. Sehubungan dengan itu, kempen kesedaran berterusan melalui media penyiaran dan media cetak wajar dipergiat demi membina masa depan negara yang lebih sejahtera dan mampan.`;
    scriptParagraphs = [
      { speaker: 'Pengulas Rencana', text: `Dalam era moden yang serba pantas, cabaran berkaitan ${topicRef.title.toLowerCase()} menuntut iltizam kukuh seluruh lapisan masyarakat.`, timeOffsetSeconds: 0 },
      { speaker: 'Pengulas Rencana', text: 'Menurut laporan kajian universiti tempatan, sebanyak 68 peratus responden bersetuju bahawa pendidikan awal dari rumah memainkan peranan penentu.', timeOffsetSeconds: 15 },
      { speaker: 'Pengulas Rencana', text: 'Sehubungan dengan itu, kempen kesedaran berterusan melalui media penyiaran dan media cetak wajar dipergiat.', timeOffsetSeconds: 30 },
      { speaker: 'Pengulas Rencana', text: 'Usaha ini penting demi membina masa depan negara yang lebih sejahtera dan mampan.', timeOffsetSeconds: 45 }
    ];
    questions = [
      {
        id: `q-${i}-1`,
        type: 'mcq',
        questionNumber: 1,
        prompt: 'Berapakah peratusan responden kajian yang bersetuju bahawa pendidikan dari rumah memainkan peranan penentu?',
        options: ['A. 50 peratus', 'B. 68 peratus', 'C. 75 peratus', 'D. 82 peratus'],
        correctAnswer: 'B. 68 peratus',
        explanation: 'Rencana menyatakan dengan terang: "sebanyak 68 peratus responden bersetuju bahawa pendidikan awal dari rumah memainkan peranan penentu".'
      },
      {
        id: `q-${i}-2`,
        type: 'mcq',
        questionNumber: 2,
        prompt: 'Apakah dua medium utama yang disarankan untuk mempergiat kempen kesedaran berterusan?',
        options: [
          'A. Papan iklan lebuh raya dan risalah pos',
          'B. Media penyiaran dan media cetak',
          'C. Telefon awam dan televisyen kabel',
          'D. Pawagam dan teater muzikal'
        ],
        correctAnswer: 'B. Media penyiaran dan media cetak',
        explanation: 'Rencana menyebut: "kempen kesedaran berterusan melalui media penyiaran dan media cetak wajar dipergiat".'
      },
      {
        id: `q-${i}-3`,
        type: 'true_false',
        questionNumber: 3,
        prompt: 'Pernyataan: Kajian tersebut dijalankan oleh sebuah universiti tempatan.',
        correctAnswer: true,
        explanation: 'Pernyataan ini BENAR sebagaimana dinyatakan dalam perenggan kedua rencana.'
      }
    ];
  } else {
    // Pengumuman
    script = `PERHATIAN: Pihak pengurusan sekolah ingin mengumumkan penganjuran Hari Kesedaran ${topicRef.theme} yang akan berlangsung pada hari Sabtu, 14 Oktober bermula jam 8:00 pagi di Dewan Bestari. Pelbagai aktiviti menarik disediakan termasuk pameran interaktif, pertandingan kuiz lisan, dan sesi ramah mesra bersama ikon belia kebangsaan. Semua murid Tingkatan 4 dan Tingkatan 5 diwajibkan hadir dengan berpakaian seragam sekolah yang lengkap. Sijil penyertaan peringkat negeri akan diberikan kepada semua peserta yang hadir.`;
    scriptParagraphs = [
      { speaker: 'Jurucakap Pengumuman', text: `PERHATIAN: Pihak pengurusan sekolah ingin mengumumkan penganjuran Hari Kesedaran ${topicRef.theme}.`, timeOffsetSeconds: 0 },
      { speaker: 'Jurucakap Pengumuman', text: 'Program akan berlangsung pada hari Sabtu, 14 Oktober bermula jam 8:00 pagi di Dewan Bestari.', timeOffsetSeconds: 15 },
      { speaker: 'Jurucakap Pengumuman', text: 'Pelbagai aktiviti disediakan termasuk pameran interaktif, pertandingan kuiz lisan, dan sesi ramah mesra bersama ikon belia.', timeOffsetSeconds: 30 },
      { speaker: 'Jurucakap Pengumuman', text: 'Sijil penyertaan peringkat negeri akan diberikan kepada semua peserta yang hadir dengan berpakaian seragam lengkap.', timeOffsetSeconds: 45 }
    ];
    questions = [
      {
        id: `q-${i}-1`,
        type: 'mcq',
        questionNumber: 1,
        prompt: 'Bilakah tarikh dan waktu Hari Kesedaran tersebut akan berlangsung?',
        options: [
          'A. Sabtu, 7 Oktober pada jam 7:30 pagi',
          'B. Ahad, 15 Oktober pada jam 8:30 pagi',
          'C. Sabtu, 14 Oktober pada jam 8:00 pagi',
          'D. Jumaat, 13 Oktober pada jam 9:00 pagi'
        ],
        correctAnswer: 'C. Sabtu, 14 Oktober pada jam 8:00 pagi',
        explanation: 'Pengumuman menyatakan program akan diadakan pada "Sabtu, 14 Oktober bermula jam 8:00 pagi di Dewan Bestari".'
      },
      {
        id: `q-${i}-2`,
        type: 'fill_blank',
        questionNumber: 2,
        prompt: 'Lengkapkan tempat kosong: Tempat berlangsungnya program berkenaan ialah di Dewan ________.',
        correctAnswer: 'Bestari',
        explanation: 'Pengumuman menyebut tempat acara ialah di "Dewan Bestari".'
      },
      {
        id: `q-${i}-3`,
        type: 'true_false',
        questionNumber: 3,
        prompt: 'Pernyataan: Semua murid yang hadir akan menerima sijil penyertaan peringkat negeri.',
        correctAnswer: true,
        explanation: 'Pernyataan ini BENAR kerana pengumuman menjanjikan "Sijil penyertaan peringkat negeri akan diberikan kepada semua peserta".'
      }
    ];
  }

  listeningData.push({
    id: `dengar-${i}`,
    title: `Petikan ${i}: ${genre} – ${topicRef.title}`,
    theme: topicRef.theme,
    audioDurationSeconds: 65,
    genre: genre,
    script: script,
    scriptParagraphs: scriptParagraphs,
    questions: questions,
    spmTips: `Fokus pada kata kunci genre ${genre} dan catat angka atau fakta utama semasa mendengar petikan untuk kali pertama.`
  });
}

console.log('Total listening tracks generated:', listeningData.length); // 52 items!

// Write to src/data/spmSpeakingTopics.ts
const speakingFileContent = `import { SpeakingTopic } from '../types';

export const SPM_SPEAKING_TOPICS: SpeakingTopic[] = ${JSON.stringify(finalSpeakingTopics, null, 2)};
`;

// Write to src/data/spmListeningTracks.ts
const listeningFileContent = `import { ListeningTrack } from '../types';

export const SPM_LISTENING_TRACKS: ListeningTrack[] = ${JSON.stringify(listeningData, null, 2)};
`;

fs.writeFileSync('src/data/spmSpeakingTopics.ts', speakingFileContent);
fs.writeFileSync('src/data/spmListeningTracks.ts', listeningFileContent);
console.log('Successfully wrote src/data/spmSpeakingTopics.ts and src/data/spmListeningTracks.ts!');
