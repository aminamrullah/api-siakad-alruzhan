/*
  Warnings:

  - Added the required column `updatedAt` to the `Pembayaran` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Tagihan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pembayaran" ADD COLUMN     "catatan" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Tagihan" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "komponenBiayaId" TEXT,
ADD COLUMN     "sisaTagihan" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "KomponenBiaya" (
    "id" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nominal" DOUBLE PRECISION NOT NULL,
    "prodiId" TEXT,
    "angkatan" TEXT,
    "jalurMasuk" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KomponenBiaya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PengajuanDispensasi" (
    "id" TEXT NOT NULL,
    "tagihanId" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "dokumenPendukung" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DIAJUKAN',
    "catatanAdmin" TEXT,
    "rencanaBayar" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengajuanDispensasi_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KomponenBiaya" ADD CONSTRAINT "KomponenBiaya_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tagihan" ADD CONSTRAINT "Tagihan_komponenBiayaId_fkey" FOREIGN KEY ("komponenBiayaId") REFERENCES "KomponenBiaya"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanDispensasi" ADD CONSTRAINT "PengajuanDispensasi_tagihanId_fkey" FOREIGN KEY ("tagihanId") REFERENCES "Tagihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanDispensasi" ADD CONSTRAINT "PengajuanDispensasi_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
