/*
  Warnings:

  - You are about to drop the column `ruangan` on the `JadwalKuliah` table. All the data in the column will be lost.
  - Added the required column `ruanganId` to the `JadwalKuliah` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JadwalKuliah" DROP COLUMN "ruangan",
ADD COLUMN     "ruanganId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Mahasiswa" ADD COLUMN     "orangTuaId" TEXT;

-- CreateTable
CREATE TABLE "Ruangan" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "lokasi" TEXT,

    CONSTRAINT "Ruangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrangTua" (
    "id" TEXT NOT NULL,
    "nik" TEXT,
    "namaLengkap" TEXT NOT NULL,
    "hubungan" TEXT NOT NULL,
    "pekerjaan" TEXT,
    "penghasilan" TEXT,
    "alamat" TEXT,
    "hp" TEXT,
    "email" TEXT,

    CONSTRAINT "OrangTua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumni" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "tahunLulus" TEXT NOT NULL,
    "ipk" DOUBLE PRECISION,
    "pekerjaanSaatIni" TEXT,
    "instansi" TEXT,
    "kontak" TEXT,

    CONSTRAINT "Alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asdos" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "mataKuliahId" TEXT NOT NULL,
    "dosenId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Asdos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kurikulum" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tahunMulai" TEXT NOT NULL,
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "prodiId" TEXT NOT NULL,

    CONSTRAINT "Kurikulum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KurikulumMataKuliah" (
    "id" TEXT NOT NULL,
    "kurikulumId" TEXT NOT NULL,
    "mataKuliahId" TEXT NOT NULL,
    "semesterTujuan" INTEGER NOT NULL,
    "wajib" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KurikulumMataKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KalenderAkademik" (
    "id" TEXT NOT NULL,
    "tahunAjaran" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "kegiatan" TEXT NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "KalenderAkademik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuti" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "dokumenPendukung" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "tanggalPengajuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cuti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kegiatan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenisKegiatan" TEXT NOT NULL,
    "tanggalPelaksanaan" TIMESTAMP(3) NOT NULL,
    "batasPendaftaran" TIMESTAMP(3) NOT NULL,
    "kuota" INTEGER,

    CONSTRAINT "Kegiatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendaftaranKegiatan" (
    "id" TEXT NOT NULL,
    "kegiatanId" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TERDAFTAR',
    "tanggalDaftar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendaftaranKegiatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skripsi" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pembimbing1Id" TEXT,
    "pembimbing2Id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROPOSAL',
    "tanggalPengajuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nilaiAkhir" TEXT,

    CONSTRAINT "Skripsi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pembayaran" (
    "id" TEXT NOT NULL,
    "tagihanId" TEXT NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlahBayar" DOUBLE PRECISION NOT NULL,
    "metode" TEXT NOT NULL,
    "buktiBayar" TEXT,

    CONSTRAINT "Pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beasiswa" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "namaBeasiswa" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "potonganPersen" DOUBLE PRECISION,
    "nominal" DOUBLE PRECISION,

    CONSTRAINT "Beasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Yudisium" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "tanggalYudisium" TIMESTAMP(3) NOT NULL,
    "nomorSK" TEXT NOT NULL,
    "ipkLulus" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LULUS',

    CONSTRAINT "Yudisium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SKPI" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "poinPrestasi" TEXT NOT NULL,
    "deskripsi" TEXT,

    CONSTRAINT "SKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TracerStudy" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "statusPekerjaan" TEXT NOT NULL,
    "namaInstansi" TEXT,
    "gaji" TEXT,
    "keselarasanBidang" TEXT,

    CONSTRAINT "TracerStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengumuman" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "konten" TEXT NOT NULL,
    "targetRole" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "tanggalDibuat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pengumuman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pesan" (
    "id" TEXT NOT NULL,
    "pengirimId" TEXT NOT NULL,
    "penerimaId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "konten" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pesan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KuesionerEdom" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT,
    "dosenId" TEXT NOT NULL,
    "mataKuliahId" TEXT NOT NULL,
    "skorPelayanan" INTEGER NOT NULL,
    "skorMateri" INTEGER NOT NULL,
    "saran" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KuesionerEdom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ruangan_kode_key" ON "Ruangan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "OrangTua_nik_key" ON "OrangTua"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "Alumni_mahasiswaId_key" ON "Alumni"("mahasiswaId");

-- CreateIndex
CREATE UNIQUE INDEX "KurikulumMataKuliah_kurikulumId_mataKuliahId_key" ON "KurikulumMataKuliah"("kurikulumId", "mataKuliahId");

-- CreateIndex
CREATE UNIQUE INDEX "PendaftaranKegiatan_kegiatanId_mahasiswaId_key" ON "PendaftaranKegiatan"("kegiatanId", "mahasiswaId");

-- CreateIndex
CREATE UNIQUE INDEX "Yudisium_mahasiswaId_key" ON "Yudisium"("mahasiswaId");

-- CreateIndex
CREATE UNIQUE INDEX "TracerStudy_alumniId_key" ON "TracerStudy"("alumniId");

-- AddForeignKey
ALTER TABLE "Mahasiswa" ADD CONSTRAINT "Mahasiswa_orangTuaId_fkey" FOREIGN KEY ("orangTuaId") REFERENCES "OrangTua"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JadwalKuliah" ADD CONSTRAINT "JadwalKuliah_ruanganId_fkey" FOREIGN KEY ("ruanganId") REFERENCES "Ruangan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alumni" ADD CONSTRAINT "Alumni_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asdos" ADD CONSTRAINT "Asdos_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asdos" ADD CONSTRAINT "Asdos_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asdos" ADD CONSTRAINT "Asdos_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "Dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kurikulum" ADD CONSTRAINT "Kurikulum_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KurikulumMataKuliah" ADD CONSTRAINT "KurikulumMataKuliah_kurikulumId_fkey" FOREIGN KEY ("kurikulumId") REFERENCES "Kurikulum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KurikulumMataKuliah" ADD CONSTRAINT "KurikulumMataKuliah_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuti" ADD CONSTRAINT "Cuti_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendaftaranKegiatan" ADD CONSTRAINT "PendaftaranKegiatan_kegiatanId_fkey" FOREIGN KEY ("kegiatanId") REFERENCES "Kegiatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendaftaranKegiatan" ADD CONSTRAINT "PendaftaranKegiatan_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skripsi" ADD CONSTRAINT "Skripsi_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skripsi" ADD CONSTRAINT "Skripsi_pembimbing1Id_fkey" FOREIGN KEY ("pembimbing1Id") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skripsi" ADD CONSTRAINT "Skripsi_pembimbing2Id_fkey" FOREIGN KEY ("pembimbing2Id") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pembayaran" ADD CONSTRAINT "Pembayaran_tagihanId_fkey" FOREIGN KEY ("tagihanId") REFERENCES "Tagihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beasiswa" ADD CONSTRAINT "Beasiswa_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yudisium" ADD CONSTRAINT "Yudisium_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SKPI" ADD CONSTRAINT "SKPI_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TracerStudy" ADD CONSTRAINT "TracerStudy_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "Alumni"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesan" ADD CONSTRAINT "Pesan_pengirimId_fkey" FOREIGN KEY ("pengirimId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesan" ADD CONSTRAINT "Pesan_penerimaId_fkey" FOREIGN KEY ("penerimaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KuesionerEdom" ADD CONSTRAINT "KuesionerEdom_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KuesionerEdom" ADD CONSTRAINT "KuesionerEdom_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "Dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KuesionerEdom" ADD CONSTRAINT "KuesionerEdom_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
