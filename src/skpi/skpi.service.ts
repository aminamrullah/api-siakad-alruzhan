import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SKPIService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.sKPI.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15) {
    const skip = (page - 1) * limit;
    
    // Very basic where clause, you can customize per model later
    const where = search ? { id: search } : {};

    const [data, total] = await Promise.all([
      this.prisma.sKPI.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.sKPI.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.sKPI.findUnique({
      where: { id }
    });
    if (!data) throw new NotFoundException('Data tidak ditemukan');
    return data;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.sKPI.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sKPI.delete({ where: { id } });
  }
}
