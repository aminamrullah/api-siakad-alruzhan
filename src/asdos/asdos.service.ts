import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AsdosService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.asdos.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { mahasiswa: { user: { name: { contains: search, mode: 'insensitive' as any } } } },
        { mataKuliah: { nama: { contains: search, mode: 'insensitive' as any } } },
      ]
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.asdos.findMany({
        where,
        skip,
        take: limit,
        include: { 
          mahasiswa: { include: { user: true } },
          mataKuliah: true,
          dosen: { include: { user: true } }
        },
        orderBy: { tahunAkademik: { kode: 'desc' } }
      }),
      this.prisma.asdos.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const asdos = await this.prisma.asdos.findUnique({
      where: { id },
      include: { 
        mahasiswa: { include: { user: true } },
        mataKuliah: true,
        dosen: { include: { user: true } }
      }
    });
    if (!asdos) throw new NotFoundException('Data tidak ditemukan');
    return asdos;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.asdos.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.asdos.delete({ where: { id } });
  }
}
