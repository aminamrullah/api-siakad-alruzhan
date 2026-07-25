const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const defaultPerms = {
  'SUPERADMIN': [
    'view_beranda', 'view_program_studi', 'view_mahasiswa', 'view_dosen',
    'view_asisten_dosen', 'view_orang_tua', 'view_alumni', 'view_pegawai__tendik',
    'view_ruangan', 'view_kurikulum', 'view_mata_kuliah', 'view_jadwal_kuliah',
    'view_krs_online', 'view_pengajuan_cuti', 'view_pembimbing_akademik',
    'view_tugas_akhir__skripsi', 'view_yudisium', 'view_kuesioner_edom',
    'view_skpi', 'view_tracer_study', 'view_biaya_kuliah', 'view_pembayaran',
    'view_beasiswa', 'view_honor_akademik', 'view_pengumuman', 'view_pesan', 'manage_roles'
  ],
  'BAAK': [
    'view_beranda', 'view_program_studi', 'view_mahasiswa', 'view_dosen',
    'view_asisten_dosen', 'view_orang_tua', 'view_alumni', 'view_pegawai__tendik',
    'view_ruangan', 'view_kurikulum', 'view_mata_kuliah', 'view_jadwal_kuliah',
    'view_krs_online', 'view_pengajuan_cuti', 'view_pembimbing_akademik',
    'view_tugas_akhir__skripsi', 'view_yudisium', 'view_kuesioner_edom',
    'view_skpi', 'view_tracer_study', 'view_pengumuman', 'view_pesan'
  ],
  'BAKU': [
    'view_beranda', 'view_mahasiswa', 'view_dosen', 'view_biaya_kuliah', 
    'view_pembayaran', 'view_beasiswa', 'view_honor_akademik', 'view_pengumuman', 'view_pesan'
  ],
  'MAHASISWA': [
    'view_beranda', 'view_jadwal_kuliah', 'view_krs_online', 'view_pengajuan_cuti', 
    'view_tugas_akhir__skripsi', 'view_kuesioner_edom', 'view_skpi', 'view_tracer_study', 
    'view_biaya_kuliah', 'view_pembayaran', 'view_beasiswa', 'view_pengumuman', 'view_pesan'
  ],
  'DOSEN_BIASA': [
    'view_beranda', 'view_mahasiswa', 'view_jadwal_kuliah', 'view_kuesioner_edom', 
    'view_honor_akademik', 'view_pengumuman', 'view_pesan'
  ],
  'KAPRODI': [
    'view_beranda', 'view_program_studi', 'view_mahasiswa', 'view_dosen',
    'view_asisten_dosen', 'view_orang_tua', 'view_alumni', 'view_pegawai__tendik',
    'view_ruangan', 'view_kurikulum', 'view_mata_kuliah', 'view_jadwal_kuliah',
    'view_krs_online', 'view_pengajuan_cuti', 'view_pembimbing_akademik',
    'view_tugas_akhir__skripsi', 'view_yudisium', 'view_kuesioner_edom',
    'view_skpi', 'view_tracer_study', 'view_pengumuman', 'view_pesan', 'view_honor_akademik'
  ],
  'DOSEN_WALI': [
    'view_beranda', 'view_mahasiswa', 'view_jadwal_kuliah', 'view_kuesioner_edom', 
    'view_honor_akademik', 'view_pengumuman', 'view_pesan', 'view_krs_online', 'view_pembimbing_akademik'
  ]
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/alruzhan_db?schema=public' });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const roles = await prisma.role.findMany();
  for (const role of roles) {
    if (defaultPerms[role.name]) {
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: defaultPerms[role.name] }
      });
      console.log(`Updated permissions for ${role.name}`);
    } else {
      console.log(`No default permissions found for ${role.name}, skipping.`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
