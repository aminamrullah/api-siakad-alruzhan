import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PmbService {
  constructor(private prisma: PrismaService) {}

  async getActivePengaturan() {
    const now = new Date();
    return this.prisma.pengaturanPMB.findMany({
      where: {
        isAktif: true,
        tanggalBuka: { lte: now },
        tanggalTutup: { gte: now }
      },
      include: {
        tahunAkademik: true
      }
    });
  }

  async getAllPengaturan() {
    return this.prisma.pengaturanPMB.findMany({
      include: { tahunAkademik: true },
      orderBy: { tanggalBuka: 'desc' }
    });
  }

  async createPengaturan(data: any) {
    return this.prisma.pengaturanPMB.create({
      data: {
        tahunAkademikId: data.tahunAkademikId,
        namaGelombang: data.namaGelombang,
        tanggalBuka: new Date(data.tanggalBuka),
        tanggalTutup: new Date(data.tanggalTutup),
        biayaPendaftaran: Number(data.biayaPendaftaran) || 0,
        isAktif: data.isAktif ?? true
      }
    });
  }
  
  async updatePengaturan(id: string, data: any) {
    const updateData: any = { ...data };
    if (data.tanggalBuka) updateData.tanggalBuka = new Date(data.tanggalBuka);
    if (data.tanggalTutup) updateData.tanggalTutup = new Date(data.tanggalTutup);
    if (data.biayaPendaftaran !== undefined) updateData.biayaPendaftaran = Number(data.biayaPendaftaran);
    
    return this.prisma.pengaturanPMB.update({
      where: { id },
      data: updateData
    });
  }

  async register(data: any) {
    let gelombangName = data.gelombang || '1';
    let biaya = 0;
    
    // Check active pengaturan if provided
    if (data.pengaturanPmbId) {
       const pengaturan = await this.prisma.pengaturanPMB.findUnique({ where: { id: data.pengaturanPmbId } });
       if (!pengaturan || !pengaturan.isAktif) {
         throw new BadRequestException('Gelombang pendaftaran tidak valid atau sudah ditutup');
       }
       const now = new Date();
       if (now < pengaturan.tanggalBuka || now > pengaturan.tanggalTutup) {
         throw new BadRequestException('Masa pendaftaran untuk gelombang ini sudah ditutup');
       }
       gelombangName = pengaturan.namaGelombang;
       biaya = pengaturan.biayaPendaftaran;
    }

    // Generate nomor pendaftaran
    const count = await this.prisma.calonMahasiswa.count();
    const nomorPendaftaran = `PMB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const statusPembayaran = biaya > 0 ? 'BELUM_BAYAR' : 'LUNAS';

    return this.prisma.calonMahasiswa.create({
      data: {
        nomorPendaftaran,
        namaLengkap: data.namaLengkap,
        nik: data.nik,
        email: data.email,
        hp: data.hp,
        asalSekolah: data.asalSekolah,
        jalurMasuk: data.jalurMasuk || 'REGULER',
        gelombang: gelombangName,
        pengaturanPmbId: data.pengaturanPmbId,
        prodiPilihan1Id: data.prodiPilihan1Id,
        prodiPilihan2Id: data.prodiPilihan2Id,
        status: 'MENUNGGU',
        statusPembayaran,
      },
    });
  }

  async findAll(status?: string) {
    return this.prisma.calonMahasiswa.findMany({
      where: status ? { status } : undefined,
      include: {
        prodiPilihan1: true,
        prodiPilihan2: true,
        pengaturanPmb: true,
      },
      orderBy: { tanggalDaftar: 'desc' },
    });
  }

  async findOne(id: string) {
    const calon = await this.prisma.calonMahasiswa.findUnique({
      where: { id },
      include: {
        prodiPilihan1: true,
        prodiPilihan2: true,
        pengaturanPmb: true,
      },
    });
    if (!calon) throw new NotFoundException('Calon Mahasiswa not found');
    return calon;
  }

  async approve(id: string) {
    const calon = await this.findOne(id);
    if (calon.status !== 'MENUNGGU') {
      throw new BadRequestException('Status pendaftar bukan MENUNGGU');
    }
    
    if (calon.statusPembayaran !== 'LUNAS') {
      throw new BadRequestException('Pembayaran pendaftar belum lunas');
    }

    // Generate User for Mahasiswa
    // Gunakan transaksi untuk menjaga integritas data
    return this.prisma.$transaction(async (tx) => {
      // 1. Update status calon
      const updatedCalon = await tx.calonMahasiswa.update({
        where: { id },
        data: { status: 'LULUS' },
      });

      // 2. Generate NIM (Tahun + Prodi + Urutan)
      // Contoh sederhana:
      const yearStr = new Date().getFullYear().toString().slice(2);
      const mhsCount = await tx.mahasiswa.count({
        where: { prodiId: calon.prodiPilihan1Id }
      });
      const nim = `${yearStr}${calon.prodiPilihan1Id.substring(0, 3).toUpperCase()}${String(mhsCount + 1).padStart(3, '0')}`;

      // 3. Ambil role MAHASISWA
      const roleMhs = await tx.role.findUnique({ where: { name: 'MAHASISWA' } });
      let roleId = roleMhs?.id;
      if (!roleId) {
        // Fallback jika belum ada
        const newRole = await tx.role.create({
          data: { name: 'MAHASISWA', permissions: [] }
        });
        roleId = newRole.id;
      }

      // 4. Create User
      // Note: Use a default password like '123456' hashed. Assuming bcrypt is available or just plain if hashing is done in interceptor/model. 
      // In NestJS usually handled by auth service, we just store standard password.
      // We will hash it if we have bcrypt, otherwise we just store it (assuming we might need to hash it)
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);

      const user = await tx.user.create({
        data: {
          email: calon.email,
          password: hashedPassword,
          name: calon.namaLengkap,
          roleId: roleId,
        }
      });

      // 5. Create Mahasiswa
      const mahasiswa = await tx.mahasiswa.create({
        data: {
          nim,
          userId: user.id,
          prodiId: calon.prodiPilihan1Id,
          status: 'AKTIF',
          nik: calon.nik,
          hp: calon.hp,
          jalurMasuk: calon.jalurMasuk,
          gelombang: calon.gelombang,
          tanggalMasuk: new Date(),
        }
      });

      return { calon: updatedCalon, mahasiswa };
    });
  }

  async reject(id: string) {
    const calon = await this.findOne(id);
    if (calon.status !== 'MENUNGGU') {
      throw new BadRequestException('Status pendaftar bukan MENUNGGU');
    }
    return this.prisma.calonMahasiswa.update({
      where: { id },
      data: { status: 'TIDAK_LULUS' },
    });
  }
  
  async uploadBukti(id: string, fileUrl: string) {
    return this.prisma.calonMahasiswa.update({
      where: { id },
      data: {
        buktiPembayaran: fileUrl,
        statusPembayaran: 'MENUNGGU_VERIFIKASI'
      }
    });
  }

  async verifyPayment(id: string) {
    return this.prisma.calonMahasiswa.update({
      where: { id },
      data: {
        statusPembayaran: 'LUNAS'
      }
    });
  }
}
