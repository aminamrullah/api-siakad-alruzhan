import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class KrsStatusService {
  constructor(private prisma: PrismaService) {}

  async getStatus(mahasiswaId: string, tahunAkademikId: string) {
    let status = await this.prisma.statusKrsMahasiswa.findUnique({
      where: {
        mahasiswaId_tahunAkademikId: { mahasiswaId, tahunAkademikId },
      },
    });

    if (!status) {
      status = await this.prisma.statusKrsMahasiswa.create({
        data: {
          mahasiswaId,
          tahunAkademikId,
          isKeuanganDibuka: false,
          statusPengajuan: 'DRAFT',
        },
      });
    }

    return status;
  }

  async bukaAksesKeuangan(mahasiswaId: string, tahunAkademikId: string, buka: boolean) {
    const status = await this.getStatus(mahasiswaId, tahunAkademikId);
    return this.prisma.statusKrsMahasiswa.update({
      where: { id: status.id },
      data: { isKeuanganDibuka: buka },
    });
  }

  async ajukanKrs(mahasiswaId: string, tahunAkademikId: string) {
    const status = await this.getStatus(mahasiswaId, tahunAkademikId);
    
    if (!status.isKeuanganDibuka) {
      throw new BadRequestException('Akses KRS belum dibuka oleh Bagian Keuangan');
    }

    if (status.statusPengajuan !== 'DRAFT' && status.statusPengajuan !== 'DITOLAK') {
      throw new BadRequestException('KRS sudah diajukan atau disetujui');
    }

    return this.prisma.statusKrsMahasiswa.update({
      where: { id: status.id },
      data: { statusPengajuan: 'DIAJUKAN' },
    });
  }

  async prosesPersetujuan(mahasiswaId: string, tahunAkademikId: string, disetujui: boolean, catatan?: string, userId?: string) {
    const status = await this.getStatus(mahasiswaId, tahunAkademikId);

    if (status.statusPengajuan !== 'DIAJUKAN' && status.statusPengajuan !== 'DISETUJUI') {
      throw new BadRequestException('KRS tidak dalam status yang dapat diproses');
    }

    const newStatus = disetujui ? 'DISETUJUI' : 'DITOLAK';

    // Update status Pengajuan
    const updated = await this.prisma.statusKrsMahasiswa.update({
      where: { id: status.id },
      data: { 
        statusPengajuan: newStatus,
        catatanWali: catatan
      },
    });

    // Update semua item KRS
    if (disetujui) {
      await this.prisma.krs.updateMany({
        where: { mahasiswaId, tahunAkademikId },
        data: { status: 'DISETUJUI' },
      });

      if (userId) {
        const dosen = await this.prisma.dosen.findUnique({ where: { userId } });
        if (dosen) {
          await this.prisma.mahasiswa.update({
            where: { id: mahasiswaId },
            data: { dosenWaliId: dosen.id },
          });
        }
      }
    } else {
      await this.prisma.krs.updateMany({
        where: { mahasiswaId, tahunAkademikId },
        data: { status: 'DITOLAK' },
      });
    }

    return updated;
  }

  // Get list of mahasiswa grouped by their KRS status (for dosen wali / keuangan)
  async getStatusList(tahunAkademikId: string, prodiId?: string, statusPengajuan?: string) {
    const where: any = { tahunAkademikId };
    
    if (prodiId) {
      where.mahasiswa = { prodiId };
    }
    
    if (statusPengajuan) {
      where.statusPengajuan = statusPengajuan;
    }

    return this.prisma.statusKrsMahasiswa.findMany({
      where,
      include: {
        mahasiswa: {
          include: {
            user: { select: { name: true, email: true } },
            prodi: true,
          }
        }
      },
      orderBy: { mahasiswa: { nim: 'asc' } },
    });
  }
}
