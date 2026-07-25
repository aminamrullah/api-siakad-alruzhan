import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class KrsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { mahasiswaId?: string; semester?: string; page?: number; limit?: number }, user?: any) {
    const { mahasiswaId, semester, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (mahasiswaId) where.mahasiswaId = mahasiswaId;
    if (semester) where.tahunAkademikId = semester;

    if (user && user.role === 'MAHASISWA') {
      where.mahasiswa = { userId: user.sub };
    }

    const [data, total] = await Promise.all([
      this.prisma.krs.findMany({
        where,
        include: {
          mahasiswa: { include: { user: { select: { name: true } } } },
          jadwal: {
            include: {
              mataKuliah: true,
              dosen: { include: { user: { select: { name: true } } } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { tahunAkademik: { kode: 'desc' } },
      }),
      this.prisma.krs.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByMahasiswa(mahasiswaId: string, semester?: string) {
    const where: any = { mahasiswaId };
    if (semester) where.tahunAkademikId = semester;

    return this.prisma.krs.findMany({
      where,
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { tahunAkademik: { kode: 'desc' } },
    });
  }

  async checkKeuangan(mahasiswaId: string) {
    const tagihanBelumLunas = await this.prisma.tagihan.findMany({
      where: {
        mahasiswaId,
        status: { in: ['BELUM_LUNAS', 'CICILAN'] },
      },
      include: { dispensasi: true },
    });

    const adaTunggakan = tagihanBelumLunas.some(t => {
      const dispensasiDisetujui = t.dispensasi.some(d => d.status === 'DISETUJUI');
      return !dispensasiDisetujui;
    });

    if (adaTunggakan) {
      throw new BadRequestException('KRS Terkunci: Anda memiliki tagihan yang belum lunas. Silakan lakukan pembayaran atau ajukan dispensasi.');
    }
  }

  async getAvailableJadwal(mahasiswaId: string, tahunAkademikId: string) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
    });
    
    if (!mahasiswa) throw new NotFoundException('Mahasiswa tidak ditemukan');

    // Cek keuangan sebelum bisa lihat jadwal
    await this.checkKeuangan(mahasiswaId);

    // Cari jadwal kuliah yang ada di tahun akademik tersebut
    // Dan hanya untuk MataKuliah yang ada di Kurikulum prodi mahasiswa.
    const jadwal = await this.prisma.jadwalKuliah.findMany({
      where: {
        tahunAkademikId,
        mataKuliah: {
          kurikulum: {
            some: {
              kurikulum: {
                prodiId: mahasiswa.prodiId,
                statusAktif: true
              }
            }
          }
        }
      },
      include: {
        mataKuliah: {
          include: {
            kurikulum: {
              where: {
                kurikulum: {
                  prodiId: mahasiswa.prodiId,
                  statusAktif: true
                }
              }
            }
          }
        },
        dosen: { include: { user: { select: { name: true } } } },
        ruanganObj: true,
      }
    });

    return jadwal;
  }

  async create(dto: { mahasiswaId: string; jadwalId: string; semester: string }, user?: any) {
    if (user && user.role === 'MAHASISWA') {
      const status = await this.prisma.statusKrsMahasiswa.findUnique({
        where: { mahasiswaId_tahunAkademikId: { mahasiswaId: dto.mahasiswaId, tahunAkademikId: dto.semester } }
      });
      if (status && (status.statusPengajuan === 'DIAJUKAN' || status.statusPengajuan === 'DISETUJUI')) {
        throw new BadRequestException('KRS sudah dikunci, tidak bisa menambah mata kuliah.');
      }
      // Cek Keuangan
      await this.checkKeuangan(dto.mahasiswaId);
    }

    // Cek duplikat
    const exists = await this.prisma.krs.findFirst({
      where: { mahasiswaId: dto.mahasiswaId, jadwalId: dto.jadwalId, tahunAkademikId: dto.semester },
    });
    if (exists) throw new BadRequestException('Mata kuliah ini sudah ada di KRS semester ini');

    return this.prisma.krs.create({
      data: { mahasiswaId: dto.mahasiswaId, jadwalId: dto.jadwalId, tahunAkademikId: dto.semester },
      include: {
        jadwal: { include: { mataKuliah: true, dosen: { include: { user: { select: { name: true } } } } } },
        mahasiswa: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async inputNilai(id: string, dto: { nilaiAkhir: number; grade: string }) {
    const krs = await this.prisma.krs.findUnique({ where: { id } });
    if (!krs) throw new NotFoundException('KRS tidak ditemukan');

    return this.prisma.krs.update({
      where: { id },
      data: { 
        nilaiAkhir: dto.nilaiAkhir, 
        grade: dto.grade,
        nilaiAbsensi: dto.nilaiAkhir,
        nilaiTugas: dto.nilaiAkhir,
        nilaiUts: dto.nilaiAkhir,
        nilaiUas: dto.nilaiAkhir
      },
      include: {
        jadwal: { include: { mataKuliah: true } },
        mahasiswa: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async delete(id: string, user?: any) {
    const krs = await this.prisma.krs.findUnique({ where: { id } });
    if (!krs) throw new NotFoundException('KRS tidak ditemukan');

    if (user && user.role === 'MAHASISWA') {
      const status = await this.prisma.statusKrsMahasiswa.findUnique({
        where: { mahasiswaId_tahunAkademikId: { mahasiswaId: krs.mahasiswaId, tahunAkademikId: krs.tahunAkademikId } }
      });
      if (status && (status.statusPengajuan === 'DIAJUKAN' || status.statusPengajuan === 'DISETUJUI')) {
        throw new BadRequestException('KRS sudah dikunci, tidak bisa menghapus mata kuliah.');
      }
    }

    await this.prisma.krs.delete({ where: { id } });
    return { message: 'KRS berhasil dihapus' };
  }
}
