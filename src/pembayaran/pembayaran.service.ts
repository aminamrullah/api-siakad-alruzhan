import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PembayaranService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.pembayaran.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15, user?: any) {
    const skip = (page - 1) * limit;
    
    let where: any = search ? { id: search } : {};

    // RLS (Data Isolation) — Pembayaran → Tagihan → Mahasiswa
    if (user && user.role === 'MAHASISWA') {
      where.tagihan = { mahasiswa: { userId: user.sub } };
    }

    const [data, total] = await Promise.all([
      this.prisma.pembayaran.findMany({
        where,
        skip,
        take: limit,
        include: { tagihan: { include: { mahasiswa: true } } }
      }),
      this.prisma.pembayaran.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.pembayaran.findUnique({
      where: { id }
    });
    if (!data) throw new NotFoundException('Data tidak ditemukan');
    return data;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.pembayaran.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.pembayaran.delete({ where: { id } });
  }
}
