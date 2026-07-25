import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalMahasiswa,
      totalDosen,
      totalKelasAktif,
      totalProdi,
      totalMataKuliah,
      mahasiswaAktif,
      mahasiswaCuti,
      mahasiswaLulus,
      tagihanBelumLunas,
      tagihanLunas,
      pengajuanDispensasiBaru,
    ] = await Promise.all([
      this.prisma.mahasiswa.count(),
      this.prisma.dosen.count(),
      this.prisma.jadwalKuliah.count(),
      this.prisma.prodi.count(),
      this.prisma.mataKuliah.count(),
      this.prisma.mahasiswa.count({ where: { status: 'AKTIF' } }),
      this.prisma.mahasiswa.count({ where: { status: 'CUTI' } }),
      this.prisma.mahasiswa.count({ where: { status: 'LULUS' } }),
      this.prisma.tagihan.count({ where: { status: { in: ['BELUM_LUNAS', 'CICILAN'] } } }),
      this.prisma.tagihan.count({ where: { status: 'LUNAS' } }),
      this.prisma.pengajuanDispensasi.count({ where: { status: 'DIAJUKAN' } }),
    ]);

    // Total amount tagihan belum lunas
    const totalTagihanBelumLunas = await this.prisma.tagihan.aggregate({
      where: { status: { in: ['BELUM_LUNAS', 'CICILAN'] } },
      _sum: { sisaTagihan: true },
    });

    // Mahasiswa terbaru
    const mahasiswaTerbaru = await this.prisma.mahasiswa.findMany({
      take: 5,
      include: { user: { select: { name: true, email: true } }, prodi: true },
      orderBy: { user: { createdAt: 'desc' } },
    });

    // Prodi dengan jumlah mahasiswa
    const prodiStats = await this.prisma.prodi.findMany({
      include: {
        _count: { select: { mahasiswa: true, dosen: true } },
      },
      orderBy: { nama: 'asc' },
    });

    return {
      overview: {
        totalMahasiswa,
        totalDosen,
        totalKelasAktif,
        totalProdi,
        totalMataKuliah,
      },
      mahasiswaStatus: {
        aktif: mahasiswaAktif,
        cuti: mahasiswaCuti,
        lulus: mahasiswaLulus,
      },
      keuangan: {
        tagihanBelumLunas,
        tagihanLunas,
        totalNominalBelumLunas: totalTagihanBelumLunas._sum.sisaTagihan || 0,
        pengajuanDispensasiBaru,
      },
      mahasiswaTerbaru,
      prodiStats,
    };
  }

  async getLaporan() {
    // Akademik
    const totalMahasiswa = await this.prisma.mahasiswa.count();
    const mahasiswaAktif = await this.prisma.mahasiswa.count({ where: { status: 'AKTIF' } });
    const mahasiswaLulus = await this.prisma.mahasiswa.count({ where: { status: 'LULUS' } });
    const mahasiswaCuti = await this.prisma.mahasiswa.count({ where: { status: 'CUTI' } });
    
    const prodiData = await this.prisma.prodi.findMany({
      include: {
        _count: { select: { mahasiswa: true, dosen: true } }
      }
    });

    // Keuangan
    const tagihanAggregate = await this.prisma.tagihan.aggregate({
      _sum: { jumlah: true },
      _count: true
    });
    
    const tagihanLunas = await this.prisma.tagihan.aggregate({
      where: { status: 'LUNAS' },
      _sum: { jumlah: true }
    });

    const tagihanBelumLunas = await this.prisma.tagihan.aggregate({
      where: { status: { in: ['BELUM_LUNAS', 'CICILAN'] } },
      _sum: { sisaTagihan: true }
    });

    // Pembayaran
    const pembayaranTerakhir = await this.prisma.pembayaran.findMany({
      take: 10,
      orderBy: { tanggalBayar: 'desc' },
      include: { tagihan: { include: { mahasiswa: { include: { user: { select: { name: true } } } } } } }
    });

    return {
      akademik: {
        totalMahasiswa,
        mahasiswaAktif,
        mahasiswaLulus,
        mahasiswaCuti,
        prodiList: prodiData.map(p => ({ nama: p.nama, jumlahMahasiswa: p._count.mahasiswa, jumlahDosen: p._count.dosen }))
      },
      keuangan: {
        totalTagihan: tagihanAggregate._sum.jumlah || 0,
        totalLunas: tagihanLunas._sum.jumlah || 0,
        totalBelumLunas: tagihanBelumLunas._sum.sisaTagihan || 0,
        pembayaranTerakhir: pembayaranTerakhir.map(p => ({
          id: p.id,
          mahasiswa: p.tagihan.mahasiswa.user.name,
          jumlah: p.jumlahBayar,
          tanggal: p.tanggalBayar,
          metode: p.metode
        }))
      }
    };
  }
}
