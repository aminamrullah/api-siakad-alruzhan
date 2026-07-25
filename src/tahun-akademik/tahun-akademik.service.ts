import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TahunAkademikService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { kode: { contains: search, mode: 'insensitive' as any } },
        { nama: { contains: search, mode: 'insensitive' as any } },
        { tahun: { contains: search, mode: 'insensitive' as any } },
      ]
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.tahunAkademik.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kode: 'desc' },
      }),
      this.prisma.tahunAkademik.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.tahunAkademik.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Tahun Akademik tidak ditemukan');
    return data;
  }

  async getAktif() {
    const data = await this.prisma.tahunAkademik.findFirst({ where: { isAktif: true } });
    return data;
  }

  async create(dto: { kode: string; nama: string; tahun: string; semester: string; isAktif?: boolean }) {
    // If setting as active, deactivate all others first
    if (dto.isAktif) {
      await this.prisma.tahunAkademik.updateMany({
        where: { isAktif: true },
        data: { isAktif: false },
      });
    }

    return this.prisma.tahunAkademik.create({ data: dto });
  }

  async update(id: string, dto: { kode?: string; nama?: string; tahun?: string; semester?: string; isAktif?: boolean }) {
    await this.findOne(id);

    // If setting as active, deactivate all others first
    if (dto.isAktif) {
      await this.prisma.tahunAkademik.updateMany({
        where: { isAktif: true, id: { not: id } },
        data: { isAktif: false },
      });
    }

    return this.prisma.tahunAkademik.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tahunAkademik.delete({ where: { id } });
    return { message: 'Tahun Akademik berhasil dihapus' };
  }

  async setAktif(id: string) {
    await this.findOne(id);

    // Deactivate all
    await this.prisma.tahunAkademik.updateMany({
      where: { isAktif: true },
      data: { isAktif: false },
    });

    // Activate this one
    return this.prisma.tahunAkademik.update({
      where: { id },
      data: { isAktif: true },
    });
  }
}
