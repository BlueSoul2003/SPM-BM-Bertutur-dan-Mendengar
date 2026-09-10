// Script to generate 52 Speaking Topics and 52 Listening Tracks for SPM Bahasa Melayu 1103
import fs from 'fs';
import path from 'path';

const speakingThemes = [
  { theme: 'Kesihatan dan Gaya Hidup Sihat', titles: [
    { title: 'Faedah Bersukan dan Mengamalkan Gaya Hidup Cergas', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Kepentingan Pemakanan Seimbang dan Diet Sihat Remaja', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Langkah Mengatasi Tekanan dan Menjaga Kesihatan Mental Pelajar', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Amalan Tidur Berkualiti dan Kesannya terhadap Prestasi Akademik', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'kumpulan' }
  ]},
  { theme: 'Alam Sekitar dan Kelestarian Hijau', titles: [
    { title: 'Amalan Kitar Semula dan Pengurangan Penggunaan Plastik Sekali Guna', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Peranan Komuniti dalam Memelihara Kebersihan Sungai dan Sumber Air', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Kepentingan Pemeliharaan Hutan Hujan Tropika dan Biodiversiti', diff: 'sukar', lvl: 'Tingkatan 5', type: 'kumpulan' },
    { title: 'Inisiatif Penggunaan Tenaga Boleh Baharu seperti Panel Solar di Sekolah', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' }
  ]},
  { theme: 'Sains, Inovasi dan Teknologi Digital', titles: [
    { title: 'Impak Penggunaan Kecerdasan Buatan (AI) dalam Pendidikan Moden', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Manfaat Aplikasi Telefon Pintar dalam Membantu Pembelajaran Murid', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Cabaran Etika dan Keselamatan dalam Dunia Realiti Maya (VR)', diff: 'sukar', lvl: 'Tingkatan 5', type: 'kumpulan' },
    { title: 'Peranan Kelab Robotik Sekolah dalam Memupuk Minat terhadap Bidang STEM', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' }
  ]},
  { theme: 'Kerjaya Alaf Baharu dan Ekonomi Gig', titles: [
    { title: 'Peluang dan Cabaran Kerjaya dalam Bidang Ekonomi Gig dan Pekerja Bebas', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Kepentingan Menguasai Kemahiran Insaniah (Soft Skills) untuk Kebolehpasaran Kerja', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Kerjaya Pemasaran Digital dan Pencipta Kandungan Kreatif Remaja', diff: 'mudah', lvl: 'Tingkatan 4', type: 'kumpulan' },
    { title: 'Pendidikan Teknikal dan Latihan Vokasional (TVET) sebagai Pilihan Kerjaya Masa Depan', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' }
  ]},
  { theme: 'Keusahawanan dan Celik Kewangan', titles: [
    { title: 'Kepentingan Menabung Sejak Usia Muda dan Pengurusan Wang Saku', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Penggunaan Transaksi Tanpa Tunai (Cashless) dan E-Dompet dalam Kalangan Murid', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Ciri-ciri Usahawan Muda yang Berdaya Saing dan Berwawasan', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'kumpulan' },
    { title: 'Langkah Mengelakkan Diri daripada Perangkap Skim Cepat Kaya dan Penipuan Pelaburan', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' }
  ]},
  { theme: 'Bahasa dan Kesusasteraan Melayu', titles: [
    { title: 'Usaha Memartabatkan Bahasa Melayu sebagai Bahasa Ilmu di Persada Global', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Kepentingan Menghayati Karya Kesusasteraan Melayu Klasik dan Moden', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Cabaran Penggunaan Bahasa Rojak di Media Sosial dan Langkah Membendungnya', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'kumpulan' }
  ]},
  { theme: 'Sejarah, Warisan dan Kesenian Bangsa', titles: [
    { title: 'Peranan Generasi Muda Memelihara Bangunan dan Monumen Bersejarah Negara', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Menghidupkan Semula Permainan Tradisional seperti Wau, Gasing dan Congkak', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Kepentingan Mempelajari Sejarah Pembentukan Malaysia demi Memperkukuh Jati Diri', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'kumpulan' },
    { title: 'Seni Silat Melayu sebagai Warisan Mempertahankan Diri dan Disiplin Rohani', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' }
  ]},
  { theme: 'Patriotisme dan Perpaduan Kaum', titles: [
    { title: 'Penghayatan Prinsip Rukun Negara ke Arah Pengukuhan Perpaduan Kaum', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Peranan Institusi Sekolah sebagai Wadah Integrasi Nasional Murid Pelbagai Kaum', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'kumpulan' },
    { title: 'Amalan Kunjung-Mengunjungi Semasa Rumah Terbuka Sempena Perayaan Kaum', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Pengorbanan Pasukan Keselamatan Negara dan Semangat Patriotik Remaja', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' }
  ]},
  { theme: 'Keselamatan Awam dan Alam Siber', titles: [
    { title: 'Langkah Berwaspada Mengelakkan Diri daripada Menjadi Mangsa Jenayah Penipuan Siber', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Disiplin Keselamatan Jalan Raya dan Pencegahan Kemalangan Motosikal Remaja', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Kesan Buruk Buli Siber terhadap Emosi Mangsa dan Cara Menanganinya', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'kumpulan' },
    { title: 'Kepentingan Mematuhi Peraturan Keselamatan di Makmal Sains Sekolah', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' }
  ]},
  { theme: 'Pertanian Moden dan Keterjaminan Makanan', titles: [
    { title: 'Penggunaan Teknologi Fertigasi dan Hidroponik dalam Sektor Agromakanan', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Menarik Minat Golongan Belia Menceburi Bidang Pertanian dan Penternakan Komersial', diff: 'sukar', lvl: 'Tingkatan 5', type: 'kumpulan' },
    { title: 'Kepentingan Keterjaminan Makanan Negara bagi Menghadapi Krisis Global', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Amalan Pertanian Organik demi Kesihatan Pengguna dan Kelestarian Tanah', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' }
  ]},
  { theme: 'Pelancongan dan Hospitaliti', titles: [
    { title: 'Potensi Eko-Pelancongan Negara dalam Menjana Pendapatan Komuniti Tempatan', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Peranan Industri Pelancongan Homestay dalam Memperkenalkan Budaya Tradisional', diff: 'mudah', lvl: 'Tingkatan 4', type: 'kumpulan' },
    { title: 'Kepelbagaian Makanan Tradisional Malaysia sebagai Daya Tarikan Pelancong Asing', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Langkah Memelihara Kebersihan Kawasan Pulau dan Pantai Peranginan', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' }
  ]},
  { theme: 'Pendidikan Maya dan Budaya Membaca', titles: [
    { title: 'Amalan Membaca Bahan Ilmiah sebagai Teras Pembentukan Modal Insan Cemerlang', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Manfaat Perpustakaan Digital dan Sumber Rujukan Terbuka untuk Murid SPM', diff: 'sederhana', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Pembelajaran Sepanjang Hayat bagi Menghadapi Cabaran Era Globalisasi', diff: 'sukar', lvl: 'Tingkatan 5', type: 'kumpulan' }
  ]},
  { theme: 'Tanggungjawab Sosial dan Kesukarelawanan', titles: [
    { title: 'Penglibatan Remaja dalam Aktiviti Kesukarelawanan dan Khidmat Masyarakat', diff: 'mudah', lvl: 'Tingkatan 4', type: 'individu' },
    { title: 'Bantuan Kemanusiaan kepada Mangsa Bencana Alam seperti Banjir Kilat', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'kumpulan' },
    { title: 'Peranan Rumah Kebajikan dan Keprihatinan Masyarakat terhadap Golongan Warga Emas', diff: 'sederhana', lvl: 'Tingkatan 5', type: 'individu' },
    { title: 'Integriti dan Amanah dalam Melaksanakan Tugas Kepemimpinan Murid di Sekolah', diff: 'sukar', lvl: 'Tingkatan 5', type: 'individu' }
  ]}
];

console.log("Speaking topic configs defined:", speakingThemes.reduce((acc, t) => acc + t.titles.length, 0));
