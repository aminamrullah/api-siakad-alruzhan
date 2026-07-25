import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OrangtuaService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.orangTua.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { namaLengkap: { contains: search, mode: 'insensitive' as any } },
        { nik: { contains: search, mode: 'insensitive' as any } },
      ]
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.orangTua.findMany({
        where,
        skip,
        take: limit,
        orderBy: { namaLengkap: 'asc' }
      }),
      this.prisma.orangTua.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const orangtua = await this.prisma.orangTua.findUnique({
      where: { id },
      include: { mahasiswa: { include: { user: true, prodi: true } } }
    });
    if (!orangtua) throw new NotFoundException('Data tidak ditemukan');
    return orangtua;
  }

  async update(id: string, data: any) {
    await this.findOne(id); // verify exists
    return this.prisma.orangTua.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.orangTua.delete({ where: { id } });
  }
}
