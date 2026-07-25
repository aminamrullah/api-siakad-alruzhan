import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DosenService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; homebaseId?: string; page?: number; limit?: number }) {
    const { search, homebaseId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (homebaseId) where.homebaseId = homebaseId;
    if (search) {
      where.OR = [
        { nidn: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.dosen.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          homebase: true,
        },
        skip,
        take: limit,
        orderBy: { nidn: 'asc' },
      }),
      this.prisma.dosen.count({ where }),
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
    const data = await this.prisma.dosen.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        homebase: true,
        mataKuliah: {
          include: { mataKuliah: true },
        },
      },
    });
    if (!data) throw new NotFoundException('Dosen tidak ditemukan');
    return data;
  }

  async create(dto: any) {
    const exists = await this.prisma.dosen.findUnique({ where: { nidn: dto.nidn } });
    if (exists) throw new BadRequestException('NIDN sudah terdaftar');

    if (dto.nik) {
      const nikExists = await this.prisma.dosen.findUnique({ where: { nik: dto.nik } });
      if (nikExists) throw new BadRequestException('NIK sudah terdaftar');
    }

    const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (emailExists) throw new BadRequestException('Email sudah terdaftar');

    const roleName = dto.roleName || 'DOSEN_BIASA';
    let role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await this.prisma.role.create({
        data: { name: roleName, permissions: ['view_schedule', 'input_grades'] },
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.dosen.create({
      data: {
        nidn: dto.nidn,
        homebase: { connect: { id: dto.homebaseId } },
        nik: dto.nik,
        jenisKelamin: dto.jenisKelamin,
        tempatLahir: dto.tempatLahir,
        tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : null,
        agama: dto.agama,
        hp: dto.hp,
        statusIkatanKerja: dto.statusIkatanKerja,
        statusAktivitas: dto.statusAktivitas,
        jabatanAkademik: dto.jabatanAkademik,
        pendidikanTerakhir: dto.pendidikanTerakhir,
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
        homebase: true,
      },
    });
  }

  async update(id: string, dto: any) {
    const dsn = await this.prisma.dosen.findUnique({ where: { id }, include: { user: true } });
    if (!dsn) throw new NotFoundException('Dosen tidak ditemukan');

    if (dto.nik && dto.nik !== dsn.nik) {
      const nikExists = await this.prisma.dosen.findUnique({ where: { nik: dto.nik } });
      if (nikExists) throw new BadRequestException('NIK sudah terdaftar');
    }

    if (dto.name || dto.email || dto.roleName) {
      const updateData: any = {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
      };

      if (dto.roleName) {
        let role = await this.prisma.role.findUnique({ where: { name: dto.roleName } });
        if (!role) {
          role = await this.prisma.role.create({
            data: { name: dto.roleName, permissions: ['view_schedule', 'input_grades'] },
          });
        }
        updateData.roleId = role.id;
      }

      await this.prisma.user.update({
        where: { id: dsn.userId },
        data: updateData,
      });
    }

    return this.prisma.dosen.update({
      where: { id },
      data: {
        ...(dto.nidn && { nidn: dto.nidn }),
        ...(dto.homebaseId && { homebaseId: dto.homebaseId }),
        ...(dto.nik !== undefined && { nik: dto.nik }),
        ...(dto.jenisKelamin !== undefined && { jenisKelamin: dto.jenisKelamin }),
        ...(dto.tempatLahir !== undefined && { tempatLahir: dto.tempatLahir }),
        ...(dto.tanggalLahir !== undefined && { tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : null }),
        ...(dto.agama !== undefined && { agama: dto.agama }),
        ...(dto.hp !== undefined && { hp: dto.hp }),
        ...(dto.statusIkatanKerja !== undefined && { statusIkatanKerja: dto.statusIkatanKerja }),
        ...(dto.statusAktivitas !== undefined && { statusAktivitas: dto.statusAktivitas }),
        ...(dto.jabatanAkademik !== undefined && { jabatanAkademik: dto.jabatanAkademik }),
        ...(dto.pendidikanTerakhir !== undefined && { pendidikanTerakhir: dto.pendidikanTerakhir }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        homebase: true,
      },
    });
  }

  async delete(id: string) {
    const dsn = await this.prisma.dosen.findUnique({ where: { id } });
    if (!dsn) throw new NotFoundException('Dosen tidak ditemukan');

    await this.prisma.dosen.delete({ where: { id } });
    return { message: 'Dosen berhasil dihapus' };
  }
}
