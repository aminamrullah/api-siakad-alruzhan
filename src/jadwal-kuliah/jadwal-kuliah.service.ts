import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JadwalKuliahService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.jadwalKuliah.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15, user?: any) {
    const skip = (page - 1) * limit;
    
    let where: any = search ? {
      OR: [
        { hari: { contains: search, mode: 'insensitive' as any } },
        { mataKuliah: { nama: { contains: search, mode: 'insensitive' as any } } },
        { dosen: { user: { name: { contains: search, mode: 'insensitive' as any } } } }
      ]
    } : {};

    if (user) {
      if (user.role === 'MAHASISWA') {
        where.krs = { some: { mahasiswa: { userId: user.sub } } };
      } else if (user.role === 'DOSEN_BIASA' || user.role === 'DOSEN_WALI') {
        where.dosen = { userId: user.sub };
      } else if (user.role === 'KAPRODI' && user.prodiId) {
        where.mataKuliah = {
          kurikulum: {
            some: {
              kurikulum: {
                prodiId: user.prodiId
              }
            }
          }
        };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.jadwalKuliah.findMany({
        where,
        skip,
        take: limit,
        include: {
          mataKuliah: true,
          dosen: { include: { user: true } },
          ruanganObj: true,
          _count: { select: { krs: true } }
        },
        orderBy: { hari: 'asc' }
      }),
      this.prisma.jadwalKuliah.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const jadwal = await this.prisma.jadwalKuliah.findUnique({
      where: { id },
      include: {
        mataKuliah: true,
        dosen: { include: { user: true } },
        ruanganObj: true
      }
    });
    if (!jadwal) throw new NotFoundException('Data tidak ditemukan');
    return jadwal;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.jadwalKuliah.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.jadwalKuliah.delete({ where: { id } });
  }
}
