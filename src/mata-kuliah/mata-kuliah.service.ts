import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MataKuliahService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; page?: number; limit?: number; prodiId?: string; kurikulumId?: string }) {
    const { search, page = 1, limit = 20, prodiId, kurikulumId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { kode: { contains: search, mode: 'insensitive' } },
        { nama: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (prodiId) {
      where.kurikulum = {
        some: {
          kurikulum: {
            prodiId: prodiId
          }
        }
      };
    }
    
    if (kurikulumId) {
      where.kurikulum = {
        some: {
          kurikulumId: kurikulumId
        }
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.mataKuliah.findMany({
        where,
        include: {
          _count: { select: { jadwal: true } },
        },
        skip,
        take: limit,
        orderBy: { kode: 'asc' },
      }),
      this.prisma.mataKuliah.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.mataKuliah.findUnique({
      where: { id },
      include: {
        jadwal: {
          include: {
            dosen: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
    if (!data) throw new NotFoundException('Mata kuliah tidak ditemukan');
    return data;
  }

  async create(dto: { kode: string; nama: string; sks: number }) {
    const exists = await this.prisma.mataKuliah.findUnique({ where: { kode: dto.kode } });
    if (exists) throw new BadRequestException('Kode mata kuliah sudah ada');
    return this.prisma.mataKuliah.create({ data: dto });
  }

  async update(id: string, dto: { kode?: string; nama?: string; sks?: number }) {
    const mk = await this.prisma.mataKuliah.findUnique({ where: { id } });
    if (!mk) throw new NotFoundException('Mata kuliah tidak ditemukan');
    return this.prisma.mataKuliah.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const mk = await this.prisma.mataKuliah.findUnique({
      where: { id },
      include: { _count: { select: { jadwal: true } } },
    });
    if (!mk) throw new NotFoundException('Mata kuliah tidak ditemukan');
    if (mk._count.jadwal > 0) {
      throw new BadRequestException('Tidak dapat menghapus mata kuliah yang sudah memiliki jadwal');
    }
    await this.prisma.mataKuliah.delete({ where: { id } });
    return { message: 'Mata kuliah berhasil dihapus' };
  }
}
