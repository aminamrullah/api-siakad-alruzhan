import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class KurikulumService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.kurikulum.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 10, prodiId?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' as any } },
        { tahunMulai: { contains: search, mode: 'insensitive' as any } },
      ];
    }
    if (prodiId) {
      where.prodiId = prodiId;
    }

    const [data, total] = await Promise.all([
      this.prisma.kurikulum.findMany({
        where,
        skip,
        take: limit,
        include: { prodi: true, _count: { select: { mataKuliah: true } } },
        orderBy: { tahunMulai: 'desc' }
      }),
      this.prisma.kurikulum.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const kurikulum = await this.prisma.kurikulum.findUnique({
      where: { id },
      include: { 
        prodi: true, 
        mataKuliah: { include: { mataKuliah: true } } 
      }
    });
    if (!kurikulum) throw new NotFoundException('Data tidak ditemukan');
    return kurikulum;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.kurikulum.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.kurikulum.delete({ where: { id } });
  }

  // Manage Kurikulum-MataKuliah relations
  async addMataKuliah(kurikulumId: string, data: { mataKuliahId: string, semesterTujuan: number, wajib: boolean }) {
    return this.prisma.kurikulumMataKuliah.create({
      data: { kurikulumId, ...data }
    });
  }

  async removeMataKuliah(kurikulumId: string, mataKuliahId: string) {
    return this.prisma.kurikulumMataKuliah.delete({
      where: {
        kurikulumId_mataKuliahId: { kurikulumId, mataKuliahId }
      }
    });
  }
}
