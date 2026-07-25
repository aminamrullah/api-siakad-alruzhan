import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateMahasiswaDto, UpdateMahasiswaDto, MahasiswaQueryDto, MahasiswaStatus } from './mahasiswa.dto';

@Injectable()
export class MahasiswaService {
  constructor(private prisma: PrismaService) { }

  async findAll(query: MahasiswaQueryDto) {
    const { search, prodiId, status } = query;
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (prodiId) where.prodiId = prodiId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nim: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.mahasiswa.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          prodi: true,
        },
        skip,
        take: limit,
        orderBy: { nim: 'asc' },
      }),
      this.prisma.mahasiswa.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.mahasiswa.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        prodi: true,
        krs: {
          include: {
            jadwal: {
              include: { mataKuliah: true, dosen: { include: { user: { select: { name: true } } } } },
            },
          },
        },
        tagihan: true,
      },
    });
    if (!data) throw new NotFoundException('Mahasiswa tidak ditemukan');

    // Calculate semesterSaatIni
    let semesterSaatIni = 1;
    if (data.angkatan) {
      const activeTahunAkademik = await this.prisma.tahunAkademik.findFirst({ where: { isAktif: true } });
      if (activeTahunAkademik) {
        const currentYear = parseInt(activeTahunAkademik.tahun.split('/')[0]);
        const angkatanYear = parseInt(data.angkatan);
        if (!isNaN(currentYear) && !isNaN(angkatanYear)) {
          const diffYear = currentYear - angkatanYear;
          if (activeTahunAkademik.semester === 'GANJIL') {
            semesterSaatIni = (diffYear * 2) + 1;
          } else if (activeTahunAkademik.semester === 'GENAP') {
            semesterSaatIni = (diffYear * 2) + 2;
          } else {
            semesterSaatIni = (diffYear * 2) + 1; // Default to ganjil for pendek or others
          }
        }
      }
    }

    return { ...data, semesterSaatIni };
  }

  async create(dto: CreateMahasiswaDto) {
    // Cek NIM unik
    const exists = await this.prisma.mahasiswa.findUnique({ where: { nim: dto.nim } });
    if (exists) throw new BadRequestException('NIM sudah terdaftar');

    // Cek NIK unik (jika ada)
    if (dto.nik) {
      const nikExists = await this.prisma.mahasiswa.findUnique({ where: { nik: dto.nik } });
      if (nikExists) throw new BadRequestException('NIK sudah terdaftar');
    }

    // Cek email unik
    const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (emailExists) throw new BadRequestException('Email sudah terdaftar');

    // Cari role MAHASISWA
    let role = await this.prisma.role.findUnique({ where: { name: 'MAHASISWA' } });
    if (!role) {
      role = await this.prisma.role.create({
        data: { name: 'MAHASISWA', permissions: ['view_grades', 'fill_krs'] },
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.mahasiswa.create({
      data: {
        nim: dto.nim,
        prodi: { connect: { id: dto.prodiId } },
        nik: dto.nik || null,
        nisn: dto.nisn || null,
        jenisKelamin: dto.jenisKelamin || null,
        tempatLahir: dto.tempatLahir || null,
        tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : null,
        agama: dto.agama || null,
        namaIbuKandung: dto.namaIbuKandung || null,
        kewarganegaraan: dto.kewarganegaraan || 'ID',
        alamat: dto.alamat || null,
        hp: dto.hp || null,
        jalurMasuk: dto.jalurMasuk || null,
        gelombang: dto.gelombang || null,
        tanggalMasuk: dto.tanggalMasuk ? new Date(dto.tanggalMasuk) : null,
        angkatan: dto.angkatan || null,
        status: dto.status || 'AKTIF',
        user: {
          create: {
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            role: { connect: { id: role.id } },
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        prodi: true,
      },
    });
  }

  async update(id: string, dto: UpdateMahasiswaDto) {
    const mhs = await this.prisma.mahasiswa.findUnique({ where: { id }, include: { user: true } });
    if (!mhs) throw new NotFoundException('Mahasiswa tidak ditemukan');

    if (dto.nik && dto.nik !== mhs.nik) {
      const nikExists = await this.prisma.mahasiswa.findUnique({ where: { nik: dto.nik } });
      if (nikExists) throw new BadRequestException('NIK sudah terdaftar');
    }

    // Update User data
    if (dto.name || dto.email) {
      await this.prisma.user.update({
        where: { id: mhs.userId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.email && { email: dto.email }),
        },
      });
    }

    // Update Mahasiswa data
    return this.prisma.mahasiswa.update({
      where: { id },
      data: {
        ...(dto.nim && { nim: dto.nim }),
        ...(dto.prodiId && { prodiId: dto.prodiId }),
        ...(dto.status && { status: dto.status }),
        ...(dto.nik !== undefined && { nik: dto.nik || null }),
        ...(dto.nisn !== undefined && { nisn: dto.nisn || null }),
        ...(dto.jenisKelamin !== undefined && { jenisKelamin: dto.jenisKelamin || null }),
        ...(dto.tempatLahir !== undefined && { tempatLahir: dto.tempatLahir || null }),
        ...(dto.tanggalLahir !== undefined && { tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : null }),
        ...(dto.agama !== undefined && { agama: dto.agama || null }),
        ...(dto.namaIbuKandung !== undefined && { namaIbuKandung: dto.namaIbuKandung || null }),
        ...(dto.kewarganegaraan !== undefined && { kewarganegaraan: dto.kewarganegaraan || 'ID' }),
        ...(dto.alamat !== undefined && { alamat: dto.alamat || null }),
        ...(dto.hp !== undefined && { hp: dto.hp || null }),
        ...(dto.jalurMasuk !== undefined && { jalurMasuk: dto.jalurMasuk || null }),
        ...(dto.gelombang !== undefined && { gelombang: dto.gelombang || null }),
        ...(dto.tanggalMasuk !== undefined && { tanggalMasuk: dto.tanggalMasuk ? new Date(dto.tanggalMasuk) : null }),
        ...(dto.angkatan !== undefined && { angkatan: dto.angkatan || null }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        prodi: true,
      },
    });
  }

  async delete(id: string) {
    const mhs = await this.prisma.mahasiswa.findUnique({ where: { id } });
    if (!mhs) throw new NotFoundException('Mahasiswa tidak ditemukan');

    // Delete mahasiswa (User tetap ada, bisa juga dihapus jika perlu)
    await this.prisma.mahasiswa.delete({ where: { id } });
    return { message: 'Mahasiswa berhasil dihapus' };
  }
}
