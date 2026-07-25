/*
  Warnings:

  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nik]` on the table `Dosen` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nik]` on the table `Mahasiswa` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_userId_fkey";

-- AlterTable
ALTER TABLE "Dosen" ADD COLUMN     "agama" TEXT,
ADD COLUMN     "hp" TEXT,
ADD COLUMN     "jabatanAkademik" TEXT,
ADD COLUMN     "jenisKelamin" TEXT,
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "pendidikanTerakhir" TEXT,
ADD COLUMN     "statusAktivitas" TEXT,
ADD COLUMN     "statusIkatanKerja" TEXT,
ADD COLUMN     "tanggalLahir" TIMESTAMP(3),
ADD COLUMN     "tempatLahir" TEXT;

-- AlterTable
ALTER TABLE "Mahasiswa" ADD COLUMN     "agama" TEXT,
ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "gelombang" TEXT,
ADD COLUMN     "hp" TEXT,
ADD COLUMN     "jalurMasuk" TEXT,
ADD COLUMN     "jenisKelamin" TEXT,
ADD COLUMN     "kewarganegaraan" TEXT NOT NULL DEFAULT 'ID',
ADD COLUMN     "namaIbuKandung" TEXT,
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "nisn" TEXT,
ADD COLUMN     "tanggalLahir" TIMESTAMP(3),
ADD COLUMN     "tanggalMasuk" TIMESTAMP(3),
ADD COLUMN     "tempatLahir" TEXT;

-- DropTable
DROP TABLE "Admin";

-- CreateTable
CREATE TABLE "Pegawai" (
    "id" TEXT NOT NULL,
    "nip" TEXT,
    "userId" TEXT NOT NULL,
    "divisi" TEXT NOT NULL,
    "nik" TEXT,
    "jenisKelamin" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "agama" TEXT,
    "hp" TEXT,
    "jabatan" TEXT,
    "statusPegawai" TEXT,

    CONSTRAINT "Pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_nip_key" ON "Pegawai"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_userId_key" ON "Pegawai"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_nik_key" ON "Pegawai"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "Dosen_nik_key" ON "Dosen"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "Mahasiswa_nik_key" ON "Mahasiswa"("nik");

-- AddForeignKey
ALTER TABLE "Pegawai" ADD CONSTRAINT "Pegawai_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
