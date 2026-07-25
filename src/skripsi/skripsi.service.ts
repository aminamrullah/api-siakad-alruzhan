import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SkripsiService {
  constructor(private prisma: PrismaService) {}

  private readonly gradeFromNilai = (nilai: number): string => {
    if (nilai >= 85) return 'A';
    if (nilai >= 80) return 'A-';
    if (nilai >= 75) return 'B+';
    if (nilai >= 70) return 'B';
    if (nilai >= 65) return 'B-';
    if (nilai >= 60) return 'C+';
    if (nilai >= 55) return 'C';
    if (nilai >= 40) return 'D';
    return 'E';
  };

  // ==========================================
  // ADMIN/KAPRODI — CRUD & LIST
  // ==========================================
  async findAll(search?: string, page: number = 1, limit: number = 15, status?: string, prodiId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { mahasiswa: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { mahasiswa: { nim: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;
    if (prodiId) where.mahasiswa = { ...where.mahasiswa, prodiId };

    const [data, total] = await Promise.all([
      this.prisma.skripsi.findMany({
        where,
        skip,
        take: limit,
        include: {
          mahasiswa: { include: { user: { select: { name: true } }, prodi: true } },
          pembimbing1: { include: { user: { select: { name: true } } } },
          pembimbing2: { include: { user: { select: { name: true } } } },
          logbooks: { select: { id: true, status: true } },
          ujian: { select: { id: true, tipe: true, status: true, nilaiAkhir: true } },
          dokumenFinal: true,
        },
        orderBy: { tanggalPengajuan: 'desc' },
      }),
      this.prisma.skripsi.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const skripsi = await this.prisma.skripsi.findUnique({
      where: { id },
      include: {
        mahasiswa: { include: { user: { select: { name: true, email: true } }, prodi: true } },
        pembimbing1: { include: { user: { select: { name: true } } } },
        pembimbing2: { include: { user: { select: { name: true } } } },
        logbooks: {
          include: {
            dosen: { include: { user: { select: { name: true } } } },
          },
          orderBy: { tanggal: 'desc' },
        },
        ujian: {
          include: {
            penguji1: { include: { user: { select: { name: true } } } },
            penguji2: { include: { user: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'asc' },
        },
        dokumenFinal: true,
      },
    });
    if (!skripsi) throw new NotFoundException('Data skripsi tidak ditemukan');
    return skripsi;
  }

  async create(data: any) {
    return this.prisma.skripsi.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.skripsi.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.skripsi.delete({ where: { id } });
  }

  // ==========================================
  // KAPRODI — APPROVE / REJECT JUDUL
  // ==========================================
  async approveJudul(
    id: string,
    dto: { pembimbing1Id: string; pembimbing2Id?: string; catatan?: string },
  ) {
    const skripsi = await this.findOne(id);
    if (skripsi.status !== 'PENGAJUAN') {
      throw new BadRequestException('Hanya skripsi dengan status PENGAJUAN yang bisa disetujui');
    }

    return this.prisma.skripsi.update({
      where: { id },
      data: {
        status: 'BIMBINGAN',
        pembimbing1Id: dto.pembimbing1Id,
        pembimbing2Id: dto.pembimbing2Id || null,
        catatanKaprodi: dto.catatan || 'Judul disetujui. Silakan lanjutkan proses bimbingan.',
      },
    });
  }

  async rejectJudul(id: string, dto: { catatan: string }) {
    const skripsi = await this.findOne(id);
    if (skripsi.status !== 'PENGAJUAN') {
      throw new BadRequestException('Hanya skripsi dengan status PENGAJUAN yang bisa ditolak');
    }

    return this.prisma.skripsi.update({
      where: { id },
      data: {
        status: 'DITOLAK',
        catatanKaprodi: dto.catatan,
      },
    });
  }

  // ==========================================
  // ADMIN — JADWAL UJIAN
  // ==========================================
  async jadwalkanUjian(
    skripsiId: string,
    dto: {
      tipe: 'SEMINAR_PROPOSAL' | 'SIDANG_AKHIR';
      tanggal: string;
      ruangan?: string;
      linkZoom?: string;
      penguji1Id?: string;
      penguji2Id?: string;
      draftFileUrl?: string;
    },
  ) {
    const skripsi = await this.findOne(skripsiId);

    // Validate state
    if (dto.tipe === 'SEMINAR_PROPOSAL' && !['BIMBINGAN'].includes(skripsi.status)) {
      throw new BadRequestException('Seminar Proposal hanya bisa dijadwalkan saat status BIMBINGAN');
    }
    if (dto.tipe === 'SIDANG_AKHIR' && !['SEMINAR_PROPOSAL', 'REVISI'].includes(skripsi.status)) {
      throw new BadRequestException('Sidang Akhir hanya bisa dijadwalkan setelah Seminar Proposal');
    }

    // Check bimbingan minimum (8 kali divalidasi)
    const validBimbingan = await this.prisma.skripsiLogbook.count({
      where: { skripsiId, status: 'DIVALIDASI' },
    });
    if (validBimbingan < 8) {
      throw new BadRequestException(
        `Jumlah bimbingan yang divalidasi (${validBimbingan}) belum mencapai minimum 8 kali`,
      );
    }

    // Find pending registration
    const pendingUjian = await this.prisma.skripsiUjian.findFirst({
      where: { skripsiId, tipe: dto.tipe, status: 'MENUNGGU' },
    });

    let ujian;
    if (pendingUjian) {
      ujian = await this.prisma.skripsiUjian.update({
        where: { id: pendingUjian.id },
        data: {
          tanggal: new Date(dto.tanggal),
          ruangan: dto.ruangan,
          linkZoom: dto.linkZoom,
          penguji1Id: dto.penguji1Id,
          penguji2Id: dto.penguji2Id,
          draftFileUrl: dto.draftFileUrl || pendingUjian.draftFileUrl,
          status: 'TERJADWAL',
        },
      });
    } else {
      // Create ujian record if no pending registration
      ujian = await this.prisma.skripsiUjian.create({
        data: {
          skripsiId,
          tipe: dto.tipe,
          tanggal: new Date(dto.tanggal),
          ruangan: dto.ruangan,
          linkZoom: dto.linkZoom,
          penguji1Id: dto.penguji1Id,
          penguji2Id: dto.penguji2Id,
          draftFileUrl: dto.draftFileUrl,
          status: 'TERJADWAL',
        },
      });
    }

    // Update skripsi status
    const nextStatus = dto.tipe === 'SEMINAR_PROPOSAL' ? 'SEMINAR_PROPOSAL' : 'SIDANG_AKHIR';
    await this.prisma.skripsi.update({
      where: { id: skripsiId },
      data: { status: nextStatus },
    });

    return ujian;
  }

  // ==========================================
  // ADMIN/DOSEN — INPUT NILAI UJIAN
  // ==========================================
  async inputNilaiUjian(
    ujianId: string,
    dto: {
      nilaiPenguji1?: number;
      nilaiPenguji2?: number;
      nilaiPembimbing?: number;
      catatanRevisi?: string;
    },
  ) {
    const ujian = await this.prisma.skripsiUjian.findUnique({
      where: { id: ujianId },
      include: { skripsi: true },
    });
    if (!ujian) throw new NotFoundException('Data ujian tidak ditemukan');

    // Calculate weighted average if all values present
    const p1 = dto.nilaiPenguji1 ?? ujian.nilaiPenguji1 ?? null;
    const p2 = dto.nilaiPenguji2 ?? ujian.nilaiPenguji2 ?? null;
    const pb = dto.nilaiPembimbing ?? ujian.nilaiPembimbing ?? null;

    let nilaiAkhir: number | null = null;
    let lulus = false;

    if (p1 !== null && pb !== null) {
      // Bobot: Penguji1 35%, Penguji2 30%, Pembimbing 35% (jika ada penguji 2)
      // atau Penguji1 50%, Pembimbing 50% (jika tidak ada penguji2)
      if (p2 !== null) {
        nilaiAkhir = p1 * 0.35 + p2 * 0.3 + pb * 0.35;
      } else {
        nilaiAkhir = p1 * 0.5 + pb * 0.5;
      }
      nilaiAkhir = Math.round(nilaiAkhir * 100) / 100;
      lulus = nilaiAkhir >= 55; // minimal C
    }

    const updatedUjian = await this.prisma.skripsiUjian.update({
      where: { id: ujianId },
      data: {
        nilaiPenguji1: dto.nilaiPenguji1 ?? undefined,
        nilaiPenguji2: dto.nilaiPenguji2 ?? undefined,
        nilaiPembimbing: dto.nilaiPembimbing ?? undefined,
        nilaiAkhir: nilaiAkhir ?? undefined,
        catatanRevisi: dto.catatanRevisi ?? undefined,
        status: nilaiAkhir !== null ? (lulus ? 'LULUS' : 'TIDAK_LULUS') : 'SELESAI',
      },
    });

    // Update skripsi jika nilai sudah lengkap
    if (nilaiAkhir !== null) {
      const newStatus = lulus
        ? ujian.tipe === 'SEMINAR_PROPOSAL'
          ? 'SEMINAR_PROPOSAL'
          : 'REVISI'
        : ujian.skripsi.status; // Status tidak berubah jika tidak lulus

      await this.prisma.skripsi.update({
        where: { id: ujian.skripsiId },
        data: {
          ...(lulus && ujian.tipe === 'SIDANG_AKHIR'
            ? {
                nilaiAkhir,
                grade: this.gradeFromNilai(nilaiAkhir),
                status: 'REVISI',
              }
            : { status: newStatus }),
        },
      });
    }

    return updatedUjian;
  }

  // ==========================================
  // PUSTAKAWAN — VALIDASI DOKUMEN FINAL
  // ==========================================
  async validasiFinalisasi(
    skripsiId: string,
    dto: { status: 'DISETUJUI' | 'DITOLAK'; catatan?: string },
  ) {
    const dokumen = await this.prisma.skripsiDokumenFinal.findUnique({
      where: { skripsiId },
    });
    if (!dokumen) throw new NotFoundException('Dokumen final belum diunggah');

    await this.prisma.skripsiDokumenFinal.update({
      where: { skripsiId },
      data: {
        statusValidasi: dto.status,
        catatanPustakawan: dto.catatan,
      },
    });

    if (dto.status === 'DISETUJUI') {
      // Update status skripsi dan mahasiswa
      const skripsi = await this.prisma.skripsi.update({
        where: { id: skripsiId },
        data: {
          status: 'SELESAI',
          tanggalLulus: new Date(),
        },
      });

      // Update status akademik mahasiswa menjadi LULUS
      await this.prisma.mahasiswa.update({
        where: { id: skripsi.mahasiswaId },
        data: { status: 'LULUS' },
      });
    }

    return { message: `Dokumen final ${dto.status === 'DISETUJUI' ? 'disetujui' : 'ditolak'}` };
  }

  // ==========================================
  // STATISTICS — untuk dashboard admin
  // ==========================================
  async getStatistik() {
    const [total, byStatus] = await Promise.all([
      this.prisma.skripsi.count(),
      this.prisma.skripsi.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const statusCount: Record<string, number> = {};
    byStatus.forEach((s) => {
      statusCount[s.status] = s._count.id;
    });

    return { total, byStatus: statusCount };
  }
}
