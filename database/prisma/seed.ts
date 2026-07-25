import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding LMS data (jadwal, KRS, materi)...');

  // Ambil data yang sudah ada
  const tahunAkademik = await prisma.tahunAkademik.findFirst({ where: { isAktif: true } });
  if (!tahunAkademik) {
    console.log('⚠️  Tidak ada tahun akademik aktif. Buat dulu...');
    // Buat tahun akademik aktif
    const ta = await prisma.tahunAkademik.create({
      data: {
        kode: '20241',
        nama: 'Ganjil 2024/2025',
        tahun: '2024/2025',
        semester: 'GANJIL',
        isAktif: true,
      },
    });
    console.log('✅ Tahun Akademik dibuat:', ta.nama);
  }

  const ta = await prisma.tahunAkademik.findFirst({ where: { isAktif: true } });
  if (!ta) throw new Error('Gagal membuat tahun akademik');

  // Ambil dosen
  const dosens = await prisma.dosen.findMany({ include: { user: true } });
  if (dosens.length === 0) throw new Error('Tidak ada dosen. Jalankan seed utama dulu.');

  // Ambil mata kuliah
  const mks = await prisma.mataKuliah.findMany();
  if (mks.length === 0) throw new Error('Tidak ada mata kuliah. Jalankan seed utama dulu.');

  // Ambil ruangan
  const ruangans = await prisma.ruangan.findMany();
  if (ruangans.length === 0) throw new Error('Tidak ada ruangan. Jalankan seed utama dulu.');

  // Ambil mahasiswa
  const mahasiswas = await prisma.mahasiswa.findMany({ include: { user: true } });
  if (mahasiswas.length === 0) throw new Error('Tidak ada mahasiswa. Jalankan seed utama dulu.');

  const findMk = (kode: string) => mks.find(m => m.kode === kode)!;
  const findRuangan = (kode: string) => ruangans.find(r => r.kode === kode) || ruangans[0];

  // ==========================================
  // JADWAL KULIAH
  // ==========================================
  const jadwalDataList = [
    { mk: 'IF101', dosenIdx: 0, ruangan: 'R.101', hari: 'SENIN', mulai: '08:00', selesai: '10:30' },
    { mk: 'IF102', dosenIdx: 1, ruangan: 'R.102', hari: 'SENIN', mulai: '10:30', selesai: '13:00' },
    { mk: 'IF201', dosenIdx: 0, ruangan: 'Lab.1', hari: 'SELASA', mulai: '08:00', selesai: '10:30' },
    { mk: 'IF202', dosenIdx: 1, ruangan: 'R.103', hari: 'SELASA', mulai: '13:00', selesai: '15:30' },
    { mk: 'IF301', dosenIdx: 2, ruangan: 'R.201', hari: 'RABU', mulai: '08:00', selesai: '10:30' },
    { mk: 'IF302', dosenIdx: 2, ruangan: 'R.202', hari: 'RABU', mulai: '13:00', selesai: '17:00' },
    { mk: 'SI101', dosenIdx: 3, ruangan: 'R.203', hari: 'KAMIS', mulai: '08:00', selesai: '10:30' },
    { mk: 'AK101', dosenIdx: 4, ruangan: 'R.301', hari: 'JUMAT', mulai: '08:00', selesai: '10:30' },
    { mk: 'UM101', dosenIdx: 0, ruangan: 'R.Aula', hari: 'JUMAT', mulai: '10:30', selesai: '12:30' },
  ];

  const jadwals: any[] = [];
  for (const j of jadwalDataList) {
    const mk = findMk(j.mk);
    const dosen = dosens[j.dosenIdx % dosens.length];
    const ruangan = findRuangan(j.ruangan);

    // Cek apakah sudah ada jadwal
    const existing = await prisma.jadwalKuliah.findFirst({
      where: { mataKuliahId: mk.id, dosenId: dosen.id, tahunAkademikId: ta.id },
    });

    if (existing) {
      jadwals.push(existing);
      continue;
    }

    const jadwal = await prisma.jadwalKuliah.create({
      data: {
        tahunAkademikId: ta.id,
        mataKuliahId: mk.id,
        dosenId: dosen.id,
        ruanganId: ruangan.id,
        hari: j.hari,
        waktuMulai: j.mulai,
        waktuSelesai: j.selesai,
      },
    });
    jadwals.push(jadwal);
    console.log(`  ✅ Jadwal: ${mk.nama} — ${dosen.user.name}`);
  }

  console.log(`📅 Total jadwal: ${jadwals.length}`);

  // ==========================================
  // KRS MAHASISWA
  // ==========================================
  // Distribusi mahasiswa ke jadwal
  const krsMapping = [
    // Mahasiswa 0-4 (TI, SI) ambil IF & SI
    { mhsIdx: 0, jadwalIdxs: [0, 1, 2, 8] },
    { mhsIdx: 1, jadwalIdxs: [0, 1, 3, 8] },
    { mhsIdx: 2, jadwalIdxs: [0, 2, 4, 8] },
    { mhsIdx: 3, jadwalIdxs: [1, 3, 6, 8] },
    { mhsIdx: 4, jadwalIdxs: [0, 3, 5, 8] },
    { mhsIdx: 5, jadwalIdxs: [2, 4, 6, 8] },
    { mhsIdx: 6, jadwalIdxs: [7, 6, 8] },
    { mhsIdx: 7, jadwalIdxs: [7, 4, 8] },
    { mhsIdx: 8, jadwalIdxs: [6, 7, 8] },
    { mhsIdx: 9, jadwalIdxs: [5, 6, 8] },
    { mhsIdx: 10, jadwalIdxs: [0, 1, 2] },
    { mhsIdx: 11, jadwalIdxs: [0, 1, 4] },
    { mhsIdx: 12, jadwalIdxs: [3, 6, 7] },
    { mhsIdx: 13, jadwalIdxs: [5, 6] },
  ];

  let krsCount = 0;
  for (const km of krsMapping) {
    if (km.mhsIdx >= mahasiswas.length) continue;
    const mhs = mahasiswas[km.mhsIdx];
    if (mhs.status === 'LULUS' || mhs.status === 'CUTI') continue;

    for (const jadwalIdx of km.jadwalIdxs) {
      if (jadwalIdx >= jadwals.length) continue;
      const jadwal = jadwals[jadwalIdx];

      const existing = await prisma.krs.findFirst({
        where: { mahasiswaId: mhs.id, jadwalId: jadwal.id, tahunAkademikId: ta.id },
      });
      if (existing) continue;

      await prisma.krs.create({
        data: {
          mahasiswaId: mhs.id,
          jadwalId: jadwal.id,
          tahunAkademikId: ta.id,
          status: 'DISETUJUI',
        },
      });
      krsCount++;
    }
  }
  console.log(`📋 KRS dibuat: ${krsCount} entri`);

  // ==========================================
  // MATERI LMS (Contoh per kelas)
  // ==========================================
  const materiContoh = [
    { judul: 'Pengenalan Algoritma & Flowchart', tipe: 'PDF', deskripsi: 'Materi pengantar algoritma dan flowchart dasar', urlMateri: 'https://example.com/materi1.pdf' },
    { judul: 'Video: Konsep Dasar', tipe: 'YOUTUBE', deskripsi: 'Video penjelasan konsep dasar', urlMateri: 'https://youtube.com/watch?v=example' },
    { judul: 'Tugas 1: Buat Flowchart', tipe: 'TUGAS', deskripsi: 'Buat flowchart untuk soal yang diberikan. Kumpulkan dalam format PDF melalui Google Drive.', urlMateri: null },
  ];

  for (const jadwal of jadwals.slice(0, 3)) {
    for (const m of materiContoh) {
      const existing = await prisma.materiLms.findFirst({
        where: { jadwalId: jadwal.id, judul: m.judul },
      });
      if (existing) continue;

      await prisma.materiLms.create({
        data: {
          jadwalId: jadwal.id,
          judul: m.judul,
          deskripsi: m.deskripsi,
          tipe: m.tipe,
          urlMateri: m.urlMateri,
        },
      });
    }
  }
  console.log('📖 Materi LMS contoh dibuat');

  // ==========================================
  // AGENDA PERKULIAHAN (contoh)
  // ==========================================
  for (const jadwal of jadwals.slice(0, 3)) {
    for (let i = 1; i <= 3; i++) {
      const existing = await prisma.agendaPerkuliahan.findFirst({
        where: { jadwalId: jadwal.id, pertemuanKe: i },
      });
      if (existing) continue;

      const tanggal = new Date('2024-09-09');
      tanggal.setDate(tanggal.getDate() + (i - 1) * 7);

      await prisma.agendaPerkuliahan.create({
        data: {
          jadwalId: jadwal.id,
          pertemuanKe: i,
          tanggal,
          topik: `Pertemuan ${i} — ${['Pengantar', 'Materi Inti', 'Praktek'][i - 1]}`,
          status: 'SELESAI',
        },
      });
    }
  }
  console.log('📅 Agenda perkuliahan contoh dibuat');

  console.log('\n✅ LMS seed selesai!');
  console.log('\n🔑 Akun Dosen untuk test LMS:');
  dosens.forEach(d => {
    console.log(`   ${d.user.email} / admin123`);
  });
  console.log('\n🎓 Akun Mahasiswa untuk test LMS:');
  mahasiswas.slice(0, 5).forEach(m => {
    console.log(`   ${m.user.email} / admin123`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
