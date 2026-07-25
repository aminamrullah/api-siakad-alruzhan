const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/alruzhan_db?schema=public' });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== Seeding database after TahunAkademik migration ===\n');

  // 1. Seed Roles
  const rolesData = [
    { name: 'SUPERADMIN', permissions: ['view_beranda','view_program_studi','view_mahasiswa','view_dosen','view_asisten_dosen','view_orang_tua','view_alumni','view_pegawai__tendik','view_ruangan','view_kurikulum','view_mata_kuliah','view_jadwal_kuliah','view_krs_online','view_pengajuan_cuti','view_pembimbing_akademik','view_tugas_akhir__skripsi','view_yudisium','view_kuesioner_edom','view_skpi','view_tracer_study','view_biaya_kuliah','view_pembayaran','view_beasiswa','view_honor_akademik','view_pengumuman','view_pesan','manage_roles','view_tahun_akademik','view_kalender_akademik'] },
    { name: 'BAAK', permissions: ['view_beranda','view_program_studi','view_mahasiswa','view_dosen','view_asisten_dosen','view_orang_tua','view_alumni','view_pegawai__tendik','view_ruangan','view_kurikulum','view_mata_kuliah','view_jadwal_kuliah','view_krs_online','view_pengajuan_cuti','view_pembimbing_akademik','view_tugas_akhir__skripsi','view_yudisium','view_kuesioner_edom','view_skpi','view_tracer_study','view_pengumuman','view_pesan','view_tahun_akademik','view_kalender_akademik'] },
    { name: 'BAKU', permissions: ['view_beranda','view_mahasiswa','view_dosen','view_biaya_kuliah','view_pembayaran','view_beasiswa','view_honor_akademik','view_pengumuman','view_pesan'] },
    { name: 'MAHASISWA', permissions: ['view_beranda','view_jadwal_kuliah','view_krs_online','view_pengajuan_cuti','view_tugas_akhir__skripsi','view_kuesioner_edom','view_skpi','view_tracer_study','view_biaya_kuliah','view_pembayaran','view_beasiswa','view_pengumuman','view_pesan'] },
    { name: 'DOSEN_BIASA', permissions: ['view_beranda','view_mahasiswa','view_jadwal_kuliah','view_kuesioner_edom','view_honor_akademik','view_pengumuman','view_pesan'] },
    { name: 'KAPRODI', permissions: ['view_beranda','view_program_studi','view_mahasiswa','view_dosen','view_asisten_dosen','view_orang_tua','view_alumni','view_pegawai__tendik','view_ruangan','view_kurikulum','view_mata_kuliah','view_jadwal_kuliah','view_krs_online','view_pengajuan_cuti','view_pembimbing_akademik','view_tugas_akhir__skripsi','view_yudisium','view_kuesioner_edom','view_skpi','view_tracer_study','view_pengumuman','view_pesan','view_honor_akademik'] },
    { name: 'DOSEN_WALI', permissions: ['view_beranda','view_mahasiswa','view_jadwal_kuliah','view_kuesioner_edom','view_honor_akademik','view_pengumuman','view_pesan','view_krs_online','view_pembimbing_akademik'] },
  ];

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { permissions: r.permissions },
      create: r,
    });
    console.log(`  Role: ${r.name}`);
  }

  // 2. Seed Superadmin User
  const superadminRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@alruzhan.ac.id' },
    update: {},
    create: {
      email: 'admin@alruzhan.ac.id',
      password: hashedPassword,
      name: 'Super Admin',
      roleId: superadminRole.id,
    },
  });
  console.log('  User: admin@alruzhan.ac.id / admin123\n');

  // 3. Seed Tahun Akademik
  const tahunAkademikData = [
    { kode: '20241', nama: 'Ganjil 2024/2025', tahun: '2024/2025', semester: 'GANJIL', isAktif: false },
    { kode: '20242', nama: 'Genap 2024/2025', tahun: '2024/2025', semester: 'GENAP', isAktif: false },
    { kode: '20251', nama: 'Ganjil 2025/2026', tahun: '2025/2026', semester: 'GANJIL', isAktif: false },
    { kode: '20252', nama: 'Genap 2025/2026', tahun: '2025/2026', semester: 'GENAP', isAktif: true },
  ];

  for (const ta of tahunAkademikData) {
    await prisma.tahunAkademik.upsert({
      where: { kode: ta.kode },
      update: { isAktif: ta.isAktif },
      create: ta,
    });
    console.log(`  TahunAkademik: ${ta.nama} ${ta.isAktif ? '(AKTIF)' : ''}`);
  }

  // 4. Seed Prodi
  const prodiData = [
    { kode: 'TI', nama: 'Teknik Informatika', fakultas: 'Fakultas Teknik' },
    { kode: 'SI', nama: 'Sistem Informasi', fakultas: 'Fakultas Teknik' },
  ];

  for (const p of prodiData) {
    await prisma.prodi.upsert({
      where: { kode: p.kode },
      update: {},
      create: p,
    });
    console.log(`  Prodi: ${p.nama}`);
  }

  console.log('\n=== Seeding complete! ===');
  await prisma.$disconnect();
  await pool.end();
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
