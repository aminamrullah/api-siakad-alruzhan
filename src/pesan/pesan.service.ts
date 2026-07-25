import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PesanService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.pesan.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15, user?: any) {
    const skip = (page - 1) * limit;
    
    let where: any = search ? { id: search } : {};

    if (user && user.role !== 'SUPERADMIN') {
      where.OR = [
        { pengirimId: user.sub },
        { penerimaId: user.sub }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.pesan.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.pesan.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.pesan.findUnique({
      where: { id }
    });
    if (!data) throw new NotFoundException('Data tidak ditemukan');
    return data;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.pesan.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.pesan.delete({ where: { id } });
  }
}
