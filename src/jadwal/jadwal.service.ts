import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JadwalService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { hari?: string; dosenId?: string; page?: number; limit?: number }) {
    const { hari, dosenId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (hari) where.hari = hari;
    if (dosenId) where.dosenId = dosenId;

    const [data, total] = await Promise.all([
      this.prisma.jadwalKuliah.findMany({
        where,
        include: {
          mataKuliah: true,
          dosen: { include: { user: { select: { name: true } } } },
          ruanganObj: true,
          _count: { select: { krs: true } },
        },
        skip,
        take: limit,
        orderBy: [{ hari: 'asc' }, { waktuMulai: 'asc' }],
      }),
      this.prisma.jadwalKuliah.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.jadwalKuliah.findUnique({
      where: { id },
      include: {
        mataKuliah: true,
        dosen: { include: { user: { select: { name: true } }, homebase: true } },
        ruanganObj: true,
        krs: { include: { mahasiswa: { include: { user: { select: { name: true } } } } } },
      },
    });
    if (!data) throw new NotFoundException('Jadwal tidak ditemukan');
    return data;
  }

  async create(dto: { mataKuliahId: string; dosenId: string; ruanganId: string; hari: string; waktuMulai: string; waktuSelesai: string }) {
    const activeTahun = await this.prisma.tahunAkademik.findFirst({ where: { isAktif: true } });
    return this.prisma.jadwalKuliah.create({
      data: { ...dto, tahunAkademikId: activeTahun?.id || 'MISSING' },
      include: {
        mataKuliah: true,
        dosen: { include: { user: { select: { name: true } } } },
        ruanganObj: true,
      },
    });
  }

  async update(id: string, dto: { mataKuliahId?: string; dosenId?: string; ruanganId?: string; hari?: string; waktuMulai?: string; waktuSelesai?: string }) {
    const jadwal = await this.prisma.jadwalKuliah.findUnique({ where: { id } });
    if (!jadwal) throw new NotFoundException('Jadwal tidak ditemukan');

    return this.prisma.jadwalKuliah.update({
      where: { id },
      data: dto,
      include: {
        mataKuliah: true,
        dosen: { include: { user: { select: { name: true } } } },
        ruanganObj: true,
      },
    });
  }

  async delete(id: string) {
    const jadwal = await this.prisma.jadwalKuliah.findUnique({
      where: { id },
      include: { _count: { select: { krs: true } } },
    });
    if (!jadwal) throw new NotFoundException('Jadwal tidak ditemukan');
    if (jadwal._count.krs > 0) {
      throw new BadRequestException('Tidak dapat menghapus jadwal yang sudah diambil mahasiswa di KRS');
    }
    await this.prisma.jadwalKuliah.delete({ where: { id } });
    return { message: 'Jadwal berhasil dihapus' };
  }
}
