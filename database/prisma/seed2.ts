import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Mulai seeding database...');

  // ==========================================
  // ROLES
  // ==========================================
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'SUPERADMIN' }, update: {}, create: { name: 'SUPERADMIN', permissions: ['ALL'] } }),
    prisma.role.upsert({ where: { name: 'BAAK' }, update: {}, create: { name: 'BAAK', permissions: ['manage_students', 'manage_lecturers', 'manage_schedule', 'manage_grades'] } }),
    prisma.role.upsert({ where: { name: 'BAKU' }, update: {}, create: { name: 'BAKU', permissions: ['manage_billing', 'view_payments'] } }),
    prisma.role.upsert({ where: { name: 'KAPRODI' }, update: {}, create: { name: 'KAPRODI', permissions: ['view_students', 'manage_schedule', 'input_grades'] } }),
    prisma.role.upsert({ where: { name: 'DOSEN_BIASA' }, update: {}, create: { name: 'DOSEN_BIASA', permissions: ['view_schedule', 'input_grades'] } }),
    prisma.role.upsert({ where: { name: 'DOSEN_WALI' }, update: {}, create: { name: 'DOSEN_WALI', permissions: ['view_schedule', 'input_grades', 'approve_krs'] } }),
    prisma.role.upsert({ where: { name: 'MAHASISWA' }, update: {}, create: { name: 'MAHASISWA', permissions: ['view_grades', 'fill_krs', 'view_schedule'] } }),
  ]);

  const [roleSuperadmin, roleBaak, roleBaku, roleKaprodi, roleDosenBiasa, roleDosenWali, roleMahasiswa] = roles;

  // ==========================================
  // PROGRAM STUDI
  // ==========================================
  const prodiData = [
    { kode: 'TI', nama: 'Teknik Informatika', fakultas: 'Fakultas Teknik' },
    { kode: 'SI', nama: 'Sistem Informasi', fakultas: 'Fakultas Teknik' },
    { kode: 'MI', nama: 'Manajemen Informatika', fakultas: 'Fakultas Teknik' },
    { kode: 'AK', nama: 'Akuntansi', fakultas: 'Fakultas Ekonomi' },
    { kode: 'MN', nama: 'Manajemen', fakultas: 'Fakultas Ekonomi' },
  ];

  const prodis = await Promise.all(
    prodiData.map((p) =>
      prisma.prodi.upsert({ where: { kode: p.kode }, update: {}, create: p })
    )
  );

  // ==========================================
  // ADMIN USERS
  // ==========================================
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Superadmin
  await prisma.user.upsert({
    where: { email: 'admin@alruzhan.ac.id' },
    update: {},
    create: {
      email: 'admin@alruzhan.ac.id',
      password: hashedPassword,
      name: 'Administrator',
      roleId: roleSuperadmin.id,
    },
  });

  const userBaak = await prisma.user.upsert({
    where: { email: 'baak@alruzhan.ac.id' },
    update: {},
    create: {
      email: 'baak@alruzhan.ac.id',
      password: hashedPassword,
      name: 'Admin BAAK',
      roleId: roleBaak.id,
    },
  });
  await prisma.pegawai.upsert({
    where: { nip: 'NIP001' },
    update: {},
    create: { nip: 'NIP001', userId: userBaak.id, divisi: 'BAAK' },
  });

  const userBaku = await prisma.user.upsert({
    where: { email: 'baku@alruzhan.ac.id' },
    update: {},
    create: {
      email: 'baku@alruzhan.ac.id',
      password: hashedPassword,
      name: 'Admin BAKU',
      roleId: roleBaku.id,
    },
  });
  await prisma.pegawai.upsert({
    where: { nip: 'NIP002' },
    update: {},
    create: { nip: 'NIP002', userId: userBaku.id, divisi: 'BAKU' },
  });

  // ==========================================
  // DOSEN
  // ==========================================
  const dosenData = [
    { nidn: '0101018001', name: 'Dr. Ahmad Fauzi, M.Kom.', email: 'ahmad.fauzi@alruzhan.ac.id', prodiIdx: 0, role: roleKaprodi },
    { nidn: '0202028002', name: 'Siti Nurhaliza, M.T.', email: 'siti.nurhaliza@alruzhan.ac.id', prodiIdx: 0, role: roleDosenBiasa },
    { nidn: '0303038003', name: 'Dr. Budi Santoso, M.Sc.', email: 'budi.santoso@alruzhan.ac.id', prodiIdx: 1, role: roleDosenBiasa },
    { nidn: '0404048004', name: 'Rina Wati, M.Kom.', email: 'rina.wati@alruzhan.ac.id', prodiIdx: 1, role: roleDosenWali },
    { nidn: '0505058005', name: 'Dr. Hendra Gunawan, M.M.', email: 'hendra.gunawan@alruzhan.ac.id', prodiIdx: 3, role: roleDosenBiasa },
    { nidn: '0606068006', name: 'Dewi Lestari, M.Ak.', email: 'dewi.lestari@alruzhan.ac.id', prodiIdx: 3, role: roleKaprodi },
  ];

  const dosens: any[] = [];
  for (const d of dosenData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: { email: d.email, password: hashedPassword, name: d.name, roleId: d.role.id },
    });
    const dosen = await prisma.dosen.upsert({
      where: { nidn: d.nidn },
      update: {},
      create: { nidn: d.nidn, userId: user.id, homebaseId: prodis[d.prodiIdx].id },
    });
    dosens.push(dosen);
  }

  // ==========================================
  // MATA KULIAH
  // ==========================================
  const mkData = [
    { kode: 'IF101', nama: 'Algoritma dan Pemrograman', sks: 3 },
    { kode: 'IF102', nama: 'Basis Data', sks: 3 },
    { kode: 'IF201', nama: 'Pemrograman Web', sks: 3 },
    { kode: 'IF202', nama: 'Jaringan Komputer', sks: 3 },
    { kode: 'IF301', nama: 'Kecerdasan Buatan', sks: 3 },
    { kode: 'IF302', nama: 'Rekayasa Perangkat Lunak', sks: 4 },
    { kode: 'SI101', nama: 'Sistem Informasi Manajemen', sks: 3 },
    { kode: 'SI201', nama: 'Analisis dan Perancangan Sistem', sks: 3 },
    { kode: 'AK101', nama: 'Pengantar Akuntansi', sks: 3 },
    { kode: 'AK201', nama: 'Akuntansi Keuangan', sks: 3 },
    { kode: 'MN101', nama: 'Pengantar Manajemen', sks: 3 },
    { kode: 'UM101', nama: 'Bahasa Indonesia', sks: 2 },
    { kode: 'UM102', nama: 'Bahasa Inggris', sks: 2 },
    { kode: 'UM103', nama: 'Pendidikan Pancasila', sks: 2 },
  ];

  const mataKuliahs = await Promise.all(
    mkData.map((mk) =>
      prisma.mataKuliah.upsert({ where: { kode: mk.kode }, update: {}, create: mk })
    )
  );

  // ==========================================
  // RUANGAN
  // ==========================================
  const ruanganData = [
    { kode: 'R.101', nama: 'Ruang 101', kapasitas: 40, lokasi: 'Gedung A' },
    { kode: 'R.102', nama: 'Ruang 102', kapasitas: 40, lokasi: 'Gedung A' },
    { kode: 'R.103', nama: 'Ruang 103', kapasitas: 40, lokasi: 'Gedung A' },
    { kode: 'R.201', nama: 'Ruang 201', kapasitas: 50, lokasi: 'Gedung B' },
    { kode: 'R.202', nama: 'Ruang 202', kapasitas: 50, lokasi: 'Gedung B' },
    { kode: 'R.203', nama: 'Ruang 203', kapasitas: 50, lokasi: 'Gedung B' },
    { kode: 'R.204', nama: 'Ruang 204', kapasitas: 50, lokasi: 'Gedung B' },
    { kode: 'R.301', nama: 'Ruang 301', kapasitas: 30, lokasi: 'Gedung C' },
    { kode: 'R.302', nama: 'Ruang 302', kapasitas: 30, lokasi: 'Gedung C' },
    { kode: 'Lab.1', nama: 'Lab Komputer 1', kapasitas: 30, lokasi: 'Gedung F' },
    { kode: 'R.Aula', nama: 'Aula Utama', kapasitas: 200, lokasi: 'Gedung Pusat' },
  ];

  const ruangans = await Promise.all(
    ruanganData.map((r) =>
      prisma.ruangan.upsert({ where: { kode: r.kode }, update: {}, create: r })
    )
  );

  const getRuanganId = (kode: string) => {
    return ruangans.find(r => r.kode === kode)?.id || ruangans[0].id;
  };

  // ==========================================
  // JADWAL KULIAH
  // ==========================================
  // const jadwalData = [
  //   { mkIdx: 0, dosenIdx: 0, ruangan: 'R.101', hari: 'Senin', waktuMulai: '08:00', waktuSelesai: '10:30' },
  //   { mkIdx: 1, dosenIdx: 1, ruangan: 'R.102', hari: 'Senin', waktuMulai: '10:30', waktuSelesai: '13:00' },
  //   { mkIdx: 2, dosenIdx: 0, ruangan: 'Lab.1', hari: 'Selasa', waktuMulai: '08:00', waktuSelesai: '10:30' },
  //   { mkIdx: 3, dosenIdx: 1, ruangan: 'R.103', hari: 'Selasa', waktuMulai: '13:00', waktuSelesai: '15:30' },
  //   { mkIdx: 4, dosenIdx: 2, ruangan: 'R.201', hari: 'Rabu', waktuMulai: '08:00', waktuSelesai: '10:30' },
  //   { mkIdx: 5, dosenIdx: 2, ruangan: 'R.202', hari: 'Rabu', waktuMulai: '13:00', waktuSelesai: '16:00' },
  //   { mkIdx: 6, dosenIdx: 3, ruangan: 'R.203', hari: 'Kamis', waktuMulai: '08:00', waktuSelesai: '10:30' },
  //   { mkIdx: 7, dosenIdx: 3, ruangan: 'R.204', hari: 'Kamis', waktuMulai: '10:30', waktuSelesai: '13:00' },
  //   { mkIdx: 8, dosenIdx: 5, ruangan: 'R.301', hari: 'Jumat', waktuMulai: '08:00', waktuSelesai: '10:30' },
  //   { mkIdx: 9, dosenIdx: 4, ruangan: 'R.302', hari: 'Jumat', waktuMulai: '10:30', waktuSelesai: '13:00' },
  //   { mkIdx: 11, dosenIdx: 0, ruangan: 'R.Aula', hari: 'Senin', waktuMulai: '14:00', waktuSelesai: '16:00' },
  //   { mkIdx: 12, dosenIdx: 1, ruangan: 'R.Aula', hari: 'Selasa', waktuMulai: '14:00', waktuSelesai: '16:00' },
  // ];

  // const jadwals: any[] = [];
  // for (const j of jadwalData) {
  //   const jadwal = await prisma.jadwalKuliah.create({
  //     data: {
  //       mataKuliahId: mataKuliahs[j.mkIdx].id,
  //       dosenId: dosens[j.dosenIdx].id,
  //       ruanganId: getRuanganId(j.ruangan),
  //       hari: j.hari,
  //       waktuMulai: j.waktuMulai,
  //       waktuSelesai: j.waktuSelesai,
  //     },
  //   });
  //   jadwals.push(jadwal);
  // }

  // ==========================================
  // MAHASISWA
  // ==========================================
  const mhsData = [
    { nim: '2024010001', name: 'Andi Pratama', email: 'andi.pratama@student.alruzhan.ac.id', prodiIdx: 0 },
    { nim: '2024010002', name: 'Budi Setiawan', email: 'budi.setiawan@student.alruzhan.ac.id', prodiIdx: 0 },
    { nim: '2024010003', name: 'Citra Dewi', email: 'citra.dewi@student.alruzhan.ac.id', prodiIdx: 0 },
    { nim: '2024010004', name: 'Dian Safitri', email: 'dian.safitri@student.alruzhan.ac.id', prodiIdx: 1 },
    { nim: '2024010005', name: 'Eko Prasetyo', email: 'eko.prasetyo@student.alruzhan.ac.id', prodiIdx: 1 },
    { nim: '2024010006', name: 'Farah Amalia', email: 'farah.amalia@student.alruzhan.ac.id', prodiIdx: 2 },
    { nim: '2024010007', name: 'Gita Rahmawati', email: 'gita.rahmawati@student.alruzhan.ac.id', prodiIdx: 3 },
    { nim: '2024010008', name: 'Hadi Kurniawan', email: 'hadi.kurniawan@student.alruzhan.ac.id', prodiIdx: 3 },
    { nim: '2024010009', name: 'Indah Permata', email: 'indah.permata@student.alruzhan.ac.id', prodiIdx: 4 },
    { nim: '2024010010', name: 'Joko Widodo', email: 'joko.widodo@student.alruzhan.ac.id', prodiIdx: 4 },
    { nim: '2023010001', name: 'Kartika Sari', email: 'kartika.sari@student.alruzhan.ac.id', prodiIdx: 0 },
    { nim: '2023010002', name: 'Lukman Hakim', email: 'lukman.hakim@student.alruzhan.ac.id', prodiIdx: 0 },
    { nim: '2022010001', name: 'Mega Utami', email: 'mega.utami@student.alruzhan.ac.id', prodiIdx: 1 },
    { nim: '2022010002', name: 'Nanda Putra', email: 'nanda.putra@student.alruzhan.ac.id', prodiIdx: 1 },
    { nim: '2021010001', name: 'Olivia Putri', email: 'olivia.putri@student.alruzhan.ac.id', prodiIdx: 0 },
  ];

  const mahasiswas: any[] = [];
  for (const m of mhsData) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: { email: m.email, password: hashedPassword, name: m.name, roleId: roleMahasiswa.id },
    });

    let status = 'AKTIF';
    if (m.nim.startsWith('2021')) status = 'LULUS';
    if (m.nim === '2022010002') status = 'CUTI';

    const mhs = await prisma.mahasiswa.upsert({
      where: { nim: m.nim },
      update: {},
      create: { nim: m.nim, userId: user.id, prodiId: prodis[m.prodiIdx].id, status },
    });
    mahasiswas.push(mhs);
  }

  // ==========================================
  // KRS
  // ==========================================
  // const krsData = [
  //   // Andi Pratama - semester genap 2024
  //   { mhsIdx: 0, jadwalIdx: 0, semester: '2024/2025 Genap', nilaiAkhir: 85, grade: 'A' },
  //   { mhsIdx: 0, jadwalIdx: 1, semester: '2024/2025 Genap', nilaiAkhir: 78, grade: 'B+' },
  //   { mhsIdx: 0, jadwalIdx: 2, semester: '2024/2025 Genap', nilaiAkhir: 90, grade: 'A' },
  //   { mhsIdx: 0, jadwalIdx: 10, semester: '2024/2025 Genap', nilaiAkhir: 88, grade: 'A' },
  //   // Budi Setiawan
  //   { mhsIdx: 1, jadwalIdx: 0, semester: '2024/2025 Genap', nilaiAkhir: 72, grade: 'B' },
  //   { mhsIdx: 1, jadwalIdx: 1, semester: '2024/2025 Genap', nilaiAkhir: 65, grade: 'C+' },
  //   { mhsIdx: 1, jadwalIdx: 3, semester: '2024/2025 Genap', nilaiAkhir: null, grade: null },
  //   // Citra Dewi
  //   { mhsIdx: 2, jadwalIdx: 0, semester: '2024/2025 Genap', nilaiAkhir: 92, grade: 'A' },
  //   { mhsIdx: 2, jadwalIdx: 4, semester: '2024/2025 Genap', nilaiAkhir: 88, grade: 'A' },
  //   // Dian Safitri
  //   { mhsIdx: 3, jadwalIdx: 6, semester: '2024/2025 Genap', nilaiAkhir: 80, grade: 'A-' },
  //   { mhsIdx: 3, jadwalIdx: 7, semester: '2024/2025 Genap', nilaiAkhir: null, grade: null },
  //   // Gita - Akuntansi
  //   { mhsIdx: 6, jadwalIdx: 8, semester: '2024/2025 Genap', nilaiAkhir: 75, grade: 'B+' },
  //   { mhsIdx: 6, jadwalIdx: 9, semester: '2024/2025 Genap', nilaiAkhir: 82, grade: 'A-' },
  // ];

  // for (const k of krsData) {
  //   await prisma.krs.create({
  //     data: {
  //       mahasiswaId: mahasiswas[k.mhsIdx].id,
  //       jadwalId: jadwals[k.jadwalIdx].id,
  //       semester: k.semester,
  //       nilaiAkhir: k.nilaiAkhir,
  //       grade: k.grade,
  //     },
  //   });
  // }

  // ==========================================
  // TAGIHAN
  // ==========================================
  // const now = new Date();
  // const tagihanData = [
  //   { mhsIdx: 0, jenis: 'SPP', jumlah: 3500000, status: 'LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth() + 1, 15) },
  //   { mhsIdx: 0, jenis: 'SKS', jumlah: 1200000, status: 'BELUM_LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth() + 1, 15) },
  //   { mhsIdx: 1, jenis: 'SPP', jumlah: 3500000, status: 'BELUM_LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth(), 30) },
  //   { mhsIdx: 1, jenis: 'Praktikum', jumlah: 500000, status: 'BELUM_LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth() + 1, 15) },
  //   { mhsIdx: 2, jenis: 'SPP', jumlah: 3500000, status: 'LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth(), 15) },
  //   { mhsIdx: 3, jenis: 'SPP', jumlah: 3500000, status: 'LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth(), 15) },
  //   { mhsIdx: 4, jenis: 'SPP', jumlah: 3500000, status: 'BELUM_LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth() + 2, 1) },
  //   { mhsIdx: 5, jenis: 'SPP', jumlah: 3500000, status: 'BELUM_LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth() + 1, 15) },
  //   { mhsIdx: 6, jenis: 'SPP', jumlah: 3500000, status: 'LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth(), 15) },
  //   { mhsIdx: 7, jenis: 'SPP', jumlah: 3500000, status: 'BELUM_LUNAS', jatuhTempo: new Date(now.getFullYear(), now.getMonth() + 1, 10) },
  // ];

  // for (const t of tagihanData) {
  //   await prisma.tagihan.create({
  //     data: {
  //       mahasiswaId: mahasiswas[t.mhsIdx].id,
  //       jenis: t.jenis,
  //       jumlah: t.jumlah,
  //       status: t.status,
  //       jatuhTempo: t.jatuhTempo,
  //     },
  //   });
  // }

  console.log('✅ Seeding selesai!');
  console.log('📊 Data yang dibuat:');
  console.log(`   - ${roles.length} roles`);
  console.log(`   - ${prodis.length} program studi`);
  console.log(`   - 3 admin users (superadmin, BAAK, BAKU)`);
  console.log(`   - ${dosens.length} dosen`);
  console.log(`   - ${mataKuliahs.length} mata kuliah`);
  // console.log(`   - ${jadwals.length} jadwal kuliah`);
  console.log(`   - ${mahasiswas.length} mahasiswa`);
  // console.log(`   - ${krsData.length} entri KRS`);
  // console.log(`   - ${tagihanData.length} tagihan`);
  console.log('');
  console.log('🔑 Akun login:');
  console.log('   admin@alruzhan.ac.id / admin123');
  console.log('   baak@alruzhan.ac.id / admin123');
  console.log('   baku@alruzhan.ac.id / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
