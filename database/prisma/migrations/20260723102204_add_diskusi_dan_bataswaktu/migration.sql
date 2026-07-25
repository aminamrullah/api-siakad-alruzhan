-- AlterTable
ALTER TABLE "MateriLms" ADD COLUMN     "batasWaktu" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DiskusiMateri" (
    "id" TEXT NOT NULL,
    "materiId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiskusiMateri_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DiskusiMateri" ADD CONSTRAINT "DiskusiMateri_materiId_fkey" FOREIGN KEY ("materiId") REFERENCES "MateriLms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiskusiMateri" ADD CONSTRAINT "DiskusiMateri_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
