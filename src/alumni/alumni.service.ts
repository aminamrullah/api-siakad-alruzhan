import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AlumniService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.alumni.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { mahasiswa: { user: { name: { contains: search, mode: 'insensitive' as any } } } },
        { pekerjaanSaatIni: { contains: search, mode: 'insensitive' as any } },
      ]
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.alumni.findMany({
        where,
        skip,
        take: limit,
        include: { mahasiswa: { include: { user: true, prodi: true } } },
        orderBy: { tahunLulus: 'desc' }
      }),
      this.prisma.alumni.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const alumni = await this.prisma.alumni.findUnique({
      where: { id },
      include: { mahasiswa: { include: { user: true, prodi: true } } }
    });
    if (!alumni) throw new NotFoundException('Data tidak ditemukan');
    return alumni;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.alumni.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.alumni.delete({ where: { id } });
  }
}
