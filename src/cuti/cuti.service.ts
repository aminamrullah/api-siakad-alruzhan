import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CutiService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.cuti.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15) {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { alasan: { contains: search, mode: 'insensitive' as any } },
        { mahasiswa: { user: { name: { contains: search, mode: 'insensitive' as any } } } },
        { mahasiswa: { nim: { contains: search, mode: 'insensitive' as any } } }
      ]
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.cuti.findMany({
        where,
        skip,
        take: limit,
        include: {
          mahasiswa: { include: { user: true } }
        },
        orderBy: { tanggalPengajuan: 'desc' }
      }),
      this.prisma.cuti.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const cuti = await this.prisma.cuti.findUnique({
      where: { id },
      include: {
        mahasiswa: { include: { user: true, prodi: true } }
      }
    });
    if (!cuti) throw new NotFoundException('Data tidak ditemukan');
    return cuti;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.cuti.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cuti.delete({ where: { id } });
  }
}
