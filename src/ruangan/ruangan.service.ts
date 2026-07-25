import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RuanganService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { nama: { contains: search, mode: 'insensitive' as any } },
        { kode: { contains: search, mode: 'insensitive' as any } }
      ]
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.ruangan.findMany({
        where, skip, take: limit,
        orderBy: { kode: 'asc' }
      }),
      this.prisma.ruangan.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.ruangan.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Ruangan tidak ditemukan');
    return data;
  }

  async create(dto: any) {
    const exists = await this.prisma.ruangan.findUnique({ where: { kode: dto.kode } });
    if (exists) throw new BadRequestException('Kode ruangan sudah terdaftar');

    return this.prisma.ruangan.create({
      data: {
        kode: dto.kode,
        nama: dto.nama,
        kapasitas: Number(dto.kapasitas),
        lokasi: dto.lokasi
      }
    });
  }

  async update(id: string, dto: any) {
    const ruangan = await this.prisma.ruangan.findUnique({ where: { id } });
    if (!ruangan) throw new NotFoundException('Ruangan tidak ditemukan');

    if (dto.kode && dto.kode !== ruangan.kode) {
      const exists = await this.prisma.ruangan.findUnique({ where: { kode: dto.kode } });
      if (exists) throw new BadRequestException('Kode ruangan sudah terdaftar');
    }

    return this.prisma.ruangan.update({
      where: { id },
      data: {
        kode: dto.kode,
        nama: dto.nama,
        kapasitas: dto.kapasitas ? Number(dto.kapasitas) : undefined,
        lokasi: dto.lokasi
      }
    });
  }

  async remove(id: string) {
    const ruangan = await this.prisma.ruangan.findUnique({ where: { id } });
    if (!ruangan) throw new NotFoundException('Ruangan tidak ditemukan');
    
    // Check if room is used in schedules
    const inUse = await this.prisma.jadwalKuliah.findFirst({ where: { ruanganId: id } });
    if (inUse) throw new BadRequestException('Ruangan tidak bisa dihapus karena sedang digunakan dalam jadwal kuliah');

    await this.prisma.ruangan.delete({ where: { id } });
    return { message: 'Ruangan berhasil dihapus' };
  }
}
