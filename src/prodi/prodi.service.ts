import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProdiService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.prodi.findMany({
      include: {
        _count: { select: { mahasiswa: true, dosen: true } },
      },
      orderBy: { nama: 'asc' },
    });
  }

  async findOne(id: string) {
    const data = await this.prisma.prodi.findUnique({
      where: { id },
      include: {
        mahasiswa: { include: { user: { select: { name: true } } } },
        dosen: { include: { user: { select: { name: true } } } },
        _count: { select: { mahasiswa: true, dosen: true } },
      },
    });
    if (!data) throw new NotFoundException('Program studi tidak ditemukan');
    return data;
  }

  async create(dto: { kode: string; nama: string; fakultas: string }) {
    const exists = await this.prisma.prodi.findUnique({ where: { kode: dto.kode } });
    if (exists) throw new BadRequestException('Kode prodi sudah ada');

    return this.prisma.prodi.create({ data: dto });
  }

  async update(id: string, dto: { kode?: string; nama?: string; fakultas?: string }) {
    const prodi = await this.prisma.prodi.findUnique({ where: { id } });
    if (!prodi) throw new NotFoundException('Program studi tidak ditemukan');

    return this.prisma.prodi.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const prodi = await this.prisma.prodi.findUnique({
      where: { id },
      include: { _count: { select: { mahasiswa: true, dosen: true } } },
    });
    if (!prodi) throw new NotFoundException('Program studi tidak ditemukan');
    if (prodi._count.mahasiswa > 0 || prodi._count.dosen > 0) {
      throw new BadRequestException('Tidak dapat menghapus prodi yang masih memiliki mahasiswa atau dosen');
    }

    await this.prisma.prodi.delete({ where: { id } });
    return { message: 'Program studi berhasil dihapus' };
  }
}
