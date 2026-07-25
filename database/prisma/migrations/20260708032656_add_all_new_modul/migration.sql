-- AlterTable
ALTER TABLE "Krs" ADD COLUMN     "catatanWali" TEXT,
ADD COLUMN     "nilaiTugas" DOUBLE PRECISION,
ADD COLUMN     "nilaiUas" DOUBLE PRECISION,
ADD COLUMN     "nilaiUts" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'MENUNGGU';

-- AlterTable
ALTER TABLE "Mahasiswa" ADD COLUMN     "dosenWaliId" TEXT;

-- CreateTable
CREATE TABLE "AgendaPerkuliahan" (
    "id" TEXT NOT NULL,
    "jadwalId" TEXT NOT NULL,
    "pertemuanKe" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "topik" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SELESAI',

    CONSTRAINT "AgendaPerkuliahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KehadiranMahasiswa" (
    "id" TEXT NOT NULL,
    "agendaId" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "KehadiranMahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KehadiranMahasiswa_agendaId_mahasiswaId_key" ON "KehadiranMahasiswa"("agendaId", "mahasiswaId");

-- AddForeignKey
ALTER TABLE "Mahasiswa" ADD CONSTRAINT "Mahasiswa_dosenWaliId_fkey" FOREIGN KEY ("dosenWaliId") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaPerkuliahan" ADD CONSTRAINT "AgendaPerkuliahan_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "JadwalKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KehadiranMahasiswa" ADD CONSTRAINT "KehadiranMahasiswa_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "AgendaPerkuliahan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KehadiranMahasiswa" ADD CONSTRAINT "KehadiranMahasiswa_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
