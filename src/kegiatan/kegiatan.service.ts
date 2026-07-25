import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class KegiatanService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.kegiatan.create({
      data: {
        ...data,
        tanggalPelaksanaan: new Date(data.tanggalPelaksanaan),
        batasPendaftaran: new Date(data.batasPendaftaran),
        kuota: data.kuota ? Number(data.kuota) : null
      }
    });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15) {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { nama: { contains: search, mode: 'insensitive' as any } },
        { jenisKegiatan: { contains: search, mode: 'insensitive' as any } }
      ]
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.kegiatan.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { pendaftaran: true } }
        },
        orderBy: { tanggalPelaksanaan: 'desc' }
      }),
      this.prisma.kegiatan.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const kegiatan = await this.prisma.kegiatan.findUnique({
      where: { id },
      include: {
        pendaftaran: { include: { mahasiswa: { include: { user: true } } } }
      }
    });
    if (!kegiatan) throw new NotFoundException('Data tidak ditemukan');
    return kegiatan;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.kegiatan.update({
      where: { id },
      data: {
        ...data,
        tanggalPelaksanaan: data.tanggalPelaksanaan ? new Date(data.tanggalPelaksanaan) : undefined,
        batasPendaftaran: data.batasPendaftaran ? new Date(data.batasPendaftaran) : undefined,
        kuota: data.kuota ? Number(data.kuota) : undefined
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.kegiatan.delete({ where: { id } });
  }
}
