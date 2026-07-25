import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class YudisiumService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.yudisium.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15) {
    const skip = (page - 1) * limit;
    
    // Very basic where clause, you can customize per model later
    const where = search ? { id: search } : {};

    const [data, total] = await Promise.all([
      this.prisma.yudisium.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.yudisium.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.yudisium.findUnique({
      where: { id }
    });
    if (!data) throw new NotFoundException('Data tidak ditemukan');
    return data;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.yudisium.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.yudisium.delete({ where: { id } });
  }
}
