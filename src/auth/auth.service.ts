import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, dosen: { select: { homebaseId: true } } }
    });
    
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const prodiId = user.dosen ? user.dosen.homebaseId : null;
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role.name, 
      permissions: user.role.permissions || [],
      prodiId: prodiId
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: user
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        mahasiswa: { include: { prodi: true } },
        dosen: { include: { homebase: true } },
        pegawai: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const { password, ...result } = user;

    // Calculate semesterSaatIni for MAHASISWA
    if (user.role?.name === 'MAHASISWA' && result.mahasiswa) {
      const mhs = Array.isArray(result.mahasiswa) ? result.mahasiswa[0] : result.mahasiswa as any;
      if (mhs?.angkatan) {
        const activeTahun = await this.prisma.tahunAkademik.findFirst({ where: { isAktif: true } });
        if (activeTahun) {
          const currentYear = parseInt(activeTahun.tahun?.split('/')[0] || '0');
          const angkatanYear = parseInt(mhs.angkatan);
          if (!isNaN(currentYear) && !isNaN(angkatanYear)) {
            const diffYear = currentYear - angkatanYear;
            let semesterSaatIni = activeTahun.semester === 'GENAP'
              ? (diffYear * 2) + 2
              : (diffYear * 2) + 1;
            if (semesterSaatIni < 1) semesterSaatIni = 1;
            // Attach to mahasiswa object
            if (Array.isArray(result.mahasiswa)) {
              (result.mahasiswa[0] as any).semesterSaatIni = semesterSaatIni;
            } else {
              (result.mahasiswa as any).semesterSaatIni = semesterSaatIni;
            }
          }
        }
      }
    }

    return result;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password lama salah');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password baru minimal 6 karakter');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password berhasil diubah' };
  }

  async updateProfile(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, mahasiswa: true, dosen: true, pegawai: true }
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    if (data.name) {
      await this.prisma.user.update({ where: { id: userId }, data: { name: data.name } });
    }

    const { telepon, alamat } = data;
    const updateData: any = {};
    if (telepon !== undefined) updateData.telepon = telepon;
    if (alamat !== undefined) updateData.alamat = alamat;

    if (Object.keys(updateData).length > 0) {
      if (user.role.name === 'MAHASISWA' && user.mahasiswa) {
        const targetId = Array.isArray(user.mahasiswa) ? user.mahasiswa[0]?.id : (user.mahasiswa as any).id;
        if (targetId) await this.prisma.mahasiswa.update({ where: { id: targetId }, data: updateData });
      } else if (user.role.name.startsWith('DOSEN') && user.dosen) {
        const targetId = Array.isArray(user.dosen) ? user.dosen[0]?.id : (user.dosen as any).id;
        if (targetId) await this.prisma.dosen.update({ where: { id: targetId }, data: updateData });
      } else if (user.pegawai) {
        const targetId = Array.isArray(user.pegawai) ? user.pegawai[0]?.id : (user.pegawai as any).id;
        if (targetId) await this.prisma.pegawai.update({ where: { id: targetId }, data: updateData });
      }
    }
    
    return { message: 'Profil berhasil diperbarui' };
  }
}
