import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PegawaiService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; divisi?: string; page?: number; limit?: number }) {
    const { search, divisi, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (divisi) where.divisi = divisi;
    if (search) {
      where.OR = [
        { nip: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.pegawai.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        skip,
        take: limit,
        orderBy: { nip: 'asc' },
      }),
      this.prisma.pegawai.count({ where }),
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
    const data = await this.prisma.pegawai.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!data) throw new NotFoundException('Pegawai tidak ditemukan');
    return data;
  }

  async create(dto: any) {
    const nip = dto.nip && dto.nip.trim() !== '' ? dto.nip.trim() : null;
    const nik = dto.nik && dto.nik.trim() !== '' ? dto.nik.trim() : null;

    if (nip) {
      const exists = await this.prisma.pegawai.findUnique({ where: { nip } });
      if (exists) throw new BadRequestException('NIP sudah terdaftar');
    }

    if (nik) {
      const nikExists = await this.prisma.pegawai.findUnique({ where: { nik } });
      if (nikExists) throw new BadRequestException('NIK sudah terdaftar');
    }

    const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (emailExists) throw new BadRequestException('Email sudah terdaftar');

    let roleName = dto.roleName || 'BAAK';
    let role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await this.prisma.role.create({
        data: { name: roleName, permissions: ['manage_data'] },
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.pegawai.create({
      data: {
        nip: nip,
        divisi: dto.divisi,
        nik: nik,
        jenisKelamin: dto.jenisKelamin,
        tempatLahir: dto.tempatLahir,
        tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : null,
        agama: dto.agama,
        hp: dto.hp,
        jabatan: dto.jabatan,
        statusPegawai: dto.statusPegawai,
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
      },
    });
  }

  async update(id: string, dto: any) {
    const peg = await this.prisma.pegawai.findUnique({ where: { id }, include: { user: true } });
    if (!peg) throw new NotFoundException('Pegawai tidak ditemukan');

    const nip = dto.nip !== undefined && dto.nip !== null && dto.nip.trim() !== '' ? dto.nip.trim() : (dto.nip === '' ? null : undefined);
    const nik = dto.nik !== undefined && dto.nik !== null && dto.nik.trim() !== '' ? dto.nik.trim() : (dto.nik === '' ? null : undefined);

    if (nik !== undefined && nik !== peg.nik && nik !== null) {
      const nikExists = await this.prisma.pegawai.findUnique({ where: { nik } });
      if (nikExists) throw new BadRequestException('NIK sudah terdaftar');
    }

    if (nip !== undefined && nip !== peg.nip && nip !== null) {
      const nipExists = await this.prisma.pegawai.findUnique({ where: { nip } });
      if (nipExists) throw new BadRequestException('NIP sudah terdaftar');
    }

    if (dto.name || dto.email) {
      await this.prisma.user.update({
        where: { id: peg.userId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.email && { email: dto.email }),
        },
      });
    }

    return this.prisma.pegawai.update({
      where: { id },
      data: {
        ...(nip !== undefined && { nip }),
        ...(dto.divisi !== undefined && { divisi: dto.divisi }),
        ...(nik !== undefined && { nik }),
        ...(dto.jenisKelamin !== undefined && { jenisKelamin: dto.jenisKelamin }),
        ...(dto.tempatLahir !== undefined && { tempatLahir: dto.tempatLahir }),
        ...(dto.tanggalLahir !== undefined && { tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : null }),
        ...(dto.agama !== undefined && { agama: dto.agama }),
        ...(dto.hp !== undefined && { hp: dto.hp }),
        ...(dto.jabatan !== undefined && { jabatan: dto.jabatan }),
        ...(dto.statusPegawai !== undefined && { statusPegawai: dto.statusPegawai }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async delete(id: string) {
    const peg = await this.prisma.pegawai.findUnique({ where: { id } });
    if (!peg) throw new NotFoundException('Pegawai tidak ditemukan');

    await this.prisma.pegawai.delete({ where: { id } });
    return { message: 'Pegawai berhasil dihapus' };
  }
}
