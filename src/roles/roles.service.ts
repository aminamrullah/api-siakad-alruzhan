import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; permissions: string[] }) {
    return this.prisma.role.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15) {
    const skip = (page - 1) * limit;
    
    const where = search ? { name: { contains: search, mode: 'insensitive' as any } } : {};

    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.role.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.role.findUnique({
      where: { id }
    });
    if (!data) throw new NotFoundException('Role tidak ditemukan');
    return data;
  }

  async update(id: string, data: { name?: string; permissions?: string[] }) {
    await this.findOne(id);
    return this.prisma.role.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.role.delete({ where: { id } });
  }
}
