/*
  Warnings:

  - You are about to drop the column `semester` on the `Asdos` table. All the data in the column will be lost.
  - You are about to drop the column `periode` on the `Beasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `Cuti` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `KalenderAkademik` table. All the data in the column will be lost.
  - You are about to drop the column `tahunAjaran` on the `KalenderAkademik` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `Krs` table. All the data in the column will be lost.
  - The `nilaiAkhir` column on the `Skripsi` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `tahunAkademikId` to the `Asdos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tahunAkademikId` to the `Beasiswa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tahunAkademikId` to the `Cuti` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tahunAkademikId` to the `JadwalKuliah` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tahunAkademikId` to the `KalenderAkademik` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tahunAkademikId` to the `Krs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asdos" DROP COLUMN "semester",
ADD COLUMN     "tahunAkademikId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Beasiswa" DROP COLUMN "periode",
ADD COLUMN     "tahunAkademikId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Cuti" DROP COLUMN "semester",
ADD COLUMN     "tahunAkademikId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "JadwalKuliah" ADD COLUMN     "tahunAkademikId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "KalenderAkademik" DROP COLUMN "semester",
DROP COLUMN "tahunAjaran",
ADD COLUMN     "tahunAkademikId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Krs" DROP COLUMN "semester",
ADD COLUMN     "nilaiAbsensi" DOUBLE PRECISION,
ADD COLUMN     "tahunAkademikId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Mahasiswa" ADD COLUMN     "angkatan" TEXT;

-- AlterTable
ALTER TABLE "Skripsi" ADD COLUMN     "abstrak" TEXT,
ADD COLUMN     "catatanKaprodi" TEXT,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "proposalFileUrl" TEXT,
ADD COLUMN     "tanggalLulus" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENGAJUAN',
DROP COLUMN "nilaiAkhir",
ADD COLUMN     "nilaiAkhir" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Tagihan" ADD COLUMN     "tahunAkademikId" TEXT;

-- CreateTable
CREATE TABLE "TahunAkademik" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tahun" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "isAktif" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TahunAkademik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusKrsMahasiswa" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "tahunAkademikId" TEXT NOT NULL,
    "isKeuanganDibuka" BOOLEAN NOT NULL DEFAULT false,
    "statusPengajuan" TEXT NOT NULL DEFAULT 'DRAFT',
    "catatanWali" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusKrsMahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkripsiLogbook" (
    "id" TEXT NOT NULL,
    "skripsiId" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "dosenId" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "catatanMahasiswa" TEXT NOT NULL,
    "catatanDosen" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkripsiLogbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkripsiUjian" (
    "id" TEXT NOT NULL,
    "skripsiId" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3),
    "ruangan" TEXT,
    "linkZoom" TEXT,
    "draftFileUrl" TEXT,
    "penguji1Id" TEXT,
    "penguji2Id" TEXT,
    "nilaiPenguji1" DOUBLE PRECISION,
    "nilaiPenguji2" DOUBLE PRECISION,
    "nilaiPembimbing" DOUBLE PRECISION,
    "nilaiAkhir" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "catatanRevisi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkripsiUjian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkripsiDokumenFinal" (
    "id" TEXT NOT NULL,
    "skripsiId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "tanggalUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusValidasi" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "catatanPustakawan" TEXT,

    CONSTRAINT "SkripsiDokumenFinal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TahunAkademik_kode_key" ON "TahunAkademik"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "StatusKrsMahasiswa_mahasiswaId_tahunAkademikId_key" ON "StatusKrsMahasiswa"("mahasiswaId", "tahunAkademikId");

-- CreateIndex
CREATE UNIQUE INDEX "SkripsiDokumenFinal_skripsiId_key" ON "SkripsiDokumenFinal"("skripsiId");

-- AddForeignKey
ALTER TABLE "JadwalKuliah" ADD CONSTRAINT "JadwalKuliah_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Krs" ADD CONSTRAINT "Krs_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusKrsMahasiswa" ADD CONSTRAINT "StatusKrsMahasiswa_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusKrsMahasiswa" ADD CONSTRAINT "StatusKrsMahasiswa_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tagihan" ADD CONSTRAINT "Tagihan_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asdos" ADD CONSTRAINT "Asdos_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KalenderAkademik" ADD CONSTRAINT "KalenderAkademik_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuti" ADD CONSTRAINT "Cuti_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkripsiLogbook" ADD CONSTRAINT "SkripsiLogbook_skripsiId_fkey" FOREIGN KEY ("skripsiId") REFERENCES "Skripsi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkripsiLogbook" ADD CONSTRAINT "SkripsiLogbook_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkripsiLogbook" ADD CONSTRAINT "SkripsiLogbook_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkripsiUjian" ADD CONSTRAINT "SkripsiUjian_skripsiId_fkey" FOREIGN KEY ("skripsiId") REFERENCES "Skripsi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkripsiUjian" ADD CONSTRAINT "SkripsiUjian_penguji1Id_fkey" FOREIGN KEY ("penguji1Id") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkripsiUjian" ADD CONSTRAINT "SkripsiUjian_penguji2Id_fkey" FOREIGN KEY ("penguji2Id") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkripsiDokumenFinal" ADD CONSTRAINT "SkripsiDokumenFinal_skripsiId_fkey" FOREIGN KEY ("skripsiId") REFERENCES "Skripsi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beasiswa" ADD CONSTRAINT "Beasiswa_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
