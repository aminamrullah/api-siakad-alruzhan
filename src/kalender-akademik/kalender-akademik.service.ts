import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class KalenderAkademikService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const kode = `${data.tahunAjaran.replace('/', '')}${data.semester === 'Gasal' || data.semester.toUpperCase() === 'GANJIL' ? '1' : data.semester === 'Genap' ? '2' : '3'}`;
    const semesterNorm = data.semester.toUpperCase() === 'GASAL' ? 'GANJIL' : data.semester.toUpperCase();
    
    let tahunAkademik = await this.prisma.tahunAkademik.findUnique({ where: { kode } });
    if (!tahunAkademik) {
      tahunAkademik = await this.prisma.tahunAkademik.create({
        data: {
          kode,
          nama: `${data.semester} ${data.tahunAjaran}`,
          tahun: data.tahunAjaran,
          semester: semesterNorm,
          isAktif: false
        }
      });
    }

    return this.prisma.kalenderAkademik.create({ 
      data: {
        kegiatan: data.kegiatan,
        keterangan: data.keterangan,
        tanggalMulai: new Date(data.tanggalMulai),
        tanggalSelesai: new Date(data.tanggalSelesai),
        tahunAkademikId: tahunAkademik.id
      } 
    });
  }

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { kegiatan: { contains: search, mode: 'insensitive' as any } },
        { tahunAkademik: { nama: { contains: search, mode: 'insensitive' as any } } },
      ]
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.kalenderAkademik.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggalMulai: 'desc' },
        include: { tahunAkademik: true }
      }),
      this.prisma.kalenderAkademik.count({ where })
    ]);

    const mappedData = data.map(k => ({
      ...k,
      tahunAjaran: k.tahunAkademik?.tahun || '-',
      semester: k.tahunAkademik?.semester === 'GANJIL' ? 'Gasal' : k.tahunAkademik?.semester || '-'
    }));

    return {
      data: mappedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const kalender = await this.prisma.kalenderAkademik.findUnique({
      where: { id },
      include: { tahunAkademik: true }
    });
    if (!kalender) throw new NotFoundException('Data tidak ditemukan');
    return {
      ...kalender,
      tahunAjaran: kalender.tahunAkademik?.tahun || '-',
      semester: kalender.tahunAkademik?.semester === 'GANJIL' ? 'Gasal' : kalender.tahunAkademik?.semester || '-'
    };
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    
    const kode = `${data.tahunAjaran.replace('/', '')}${data.semester === 'Gasal' || data.semester.toUpperCase() === 'GANJIL' ? '1' : data.semester === 'Genap' ? '2' : '3'}`;
    const semesterNorm = data.semester.toUpperCase() === 'GASAL' ? 'GANJIL' : data.semester.toUpperCase();
    
    let tahunAkademik = await this.prisma.tahunAkademik.findUnique({ where: { kode } });
    if (!tahunAkademik) {
      tahunAkademik = await this.prisma.tahunAkademik.create({
        data: {
          kode,
          nama: `${data.semester} ${data.tahunAjaran}`,
          tahun: data.tahunAjaran,
          semester: semesterNorm,
          isAktif: false
        }
      });
    }

    return this.prisma.kalenderAkademik.update({
      where: { id },
      data: {
        kegiatan: data.kegiatan,
        keterangan: data.keterangan,
        tanggalMulai: new Date(data.tanggalMulai),
        tanggalSelesai: new Date(data.tanggalSelesai),
        tahunAkademikId: tahunAkademik.id
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.kalenderAkademik.delete({ where: { id } });
  }
}
