import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TagihanService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { mahasiswaId?: string; status?: string; jenis?: string; page?: number; limit?: number }) {
    const { mahasiswaId, status, jenis, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (mahasiswaId) where.mahasiswaId = mahasiswaId;
    if (status) where.status = status;
    if (jenis) where.jenis = jenis;

    const [data, total] = await Promise.all([
      this.prisma.tagihan.findMany({
        where,
        include: {
          mahasiswa: { include: { user: { select: { name: true } } } },
          komponenBiaya: true,
        },
        skip,
        take: limit,
        orderBy: { jatuhTempo: 'asc' },
      }),
      this.prisma.tagihan.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByMahasiswa(mahasiswaId: string) {
    return this.prisma.tagihan.findMany({
      where: { mahasiswaId },
      include: { komponenBiaya: true },
      orderBy: { jatuhTempo: 'asc' },
    });
  }

  /**
   * Buat tagihan individual — otomatis ambil nominal dari KomponenBiaya
   */
  async create(dto: {
    mahasiswaId: string;
    komponenBiayaId?: string;
    jenis?: string;
    jumlah?: number;
    jatuhTempo: string;
    tahunAkademikId?: string;
  }) {
    let jenis = dto.jenis;
    let jumlah = dto.jumlah;
    const komponenBiayaId = dto.komponenBiayaId;

    if (komponenBiayaId) {
      const kb = await this.prisma.komponenBiaya.findUnique({ where: { id: komponenBiayaId } });
      if (!kb) throw new NotFoundException('Komponen biaya tidak ditemukan');
      jenis = kb.jenis;
      jumlah = kb.nominal;
    }

    if (!jumlah || !jenis) throw new BadRequestException('Jenis dan jumlah wajib diisi');

    return this.prisma.tagihan.create({
      data: {
        mahasiswaId: dto.mahasiswaId,
        komponenBiayaId: komponenBiayaId || null,
        tahunAkademikId: dto.tahunAkademikId || null,
        jenis,
        jumlah,
        sisaTagihan: jumlah,
        status: 'BELUM_LUNAS',
        jatuhTempo: new Date(dto.jatuhTempo),
      },
      include: {
        mahasiswa: { include: { user: { select: { name: true } } } },
        komponenBiaya: true,
      },
    });
  }

  /**
   * Buat tagihan kolektif — satu/beberapa komponen biaya untuk banyak mahasiswa sekaligus
   */
  async createBatch(dto: {
    mahasiswaIds: string[];
    komponenBiayaIds: string[];
    jatuhTempo: string;
    tahunAkademikId?: string;
  }) {
    const komponenList = await this.prisma.komponenBiaya.findMany({
      where: { id: { in: dto.komponenBiayaIds } }
    });
    if (!komponenList.length) throw new NotFoundException('Komponen biaya tidak ditemukan');

    let count = 0;

    for (const mahasiswaId of dto.mahasiswaIds) {
      for (const kb of komponenList) {
        if (dto.tahunAkademikId) {
          const existing = await this.prisma.tagihan.findFirst({
            where: { mahasiswaId, komponenBiayaId: kb.id, tahunAkademikId: dto.tahunAkademikId }
          });
          if (existing) continue;
        }

        await this.prisma.tagihan.create({
          data: {
            mahasiswaId,
            komponenBiayaId: kb.id,
            tahunAkademikId: dto.tahunAkademikId || null,
            jenis: kb.jenis,
            jumlah: kb.nominal,
            sisaTagihan: kb.nominal,
            status: 'BELUM_LUNAS',
            jatuhTempo: new Date(dto.jatuhTempo),
          },
        });
        count++;
      }
    }

    return { message: `Berhasil membuat ${count} tagihan baru.`, count };
  }

  async update(id: string, dto: { status?: string; jumlah?: number; jatuhTempo?: string }) {
    const tagihan = await this.prisma.tagihan.findUnique({ where: { id } });
    if (!tagihan) throw new NotFoundException('Tagihan tidak ditemukan');

    return this.prisma.tagihan.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.jumlah && { jumlah: dto.jumlah }),
        ...(dto.jatuhTempo && { jatuhTempo: new Date(dto.jatuhTempo) }),
      },
      include: {
        mahasiswa: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async delete(id: string) {
    const tagihan = await this.prisma.tagihan.findUnique({ where: { id } });
    if (!tagihan) throw new NotFoundException('Tagihan tidak ditemukan');
    await this.prisma.tagihan.delete({ where: { id } });
    return { message: 'Tagihan berhasil dihapus' };
  }

  /**
   * Generate tagihan massal otomatis — match KomponenBiaya dengan Mahasiswa Aktif
   * Support filter: prodi, angkatan, jalur masuk, pilih komponen tertentu
   */
  async generateTagihanMassal(dto: {
    tahunAkademikId: string;
    komponenBiayaIds?: string[];
    prodiId?: string;
    angkatan?: string;
    jalurMasuk?: string;
    jatuhTempo?: string;
  }) {
    const whereKb: any = {};
    if (dto.komponenBiayaIds?.length) whereKb.id = { in: dto.komponenBiayaIds };

    const komponenBiaya = await this.prisma.komponenBiaya.findMany({ where: whereKb });

    const whereMhs: any = { status: 'AKTIF' };
    if (dto.prodiId) whereMhs.prodiId = dto.prodiId;
    if (dto.angkatan) whereMhs.angkatan = dto.angkatan;
    if (dto.jalurMasuk) whereMhs.jalurMasuk = dto.jalurMasuk;

    const mahasiswaAktif = await this.prisma.mahasiswa.findMany({ where: whereMhs });

    const jatuhTempo = dto.jatuhTempo
      ? new Date(dto.jatuhTempo)
      : new Date(new Date().setMonth(new Date().getMonth() + 1));

    let count = 0;

    for (const mhs of mahasiswaAktif) {
      for (const kb of komponenBiaya) {
        // Segmentasi dari KomponenBiaya — hanya dipakai jika tidak ada filter override
        if (!dto.prodiId && kb.prodiId && kb.prodiId !== mhs.prodiId) continue;
        if (!dto.angkatan && kb.angkatan && kb.angkatan !== mhs.angkatan) continue;
        if (!dto.jalurMasuk && kb.jalurMasuk && kb.jalurMasuk !== mhs.jalurMasuk) continue;

        const existing = await this.prisma.tagihan.findFirst({
          where: { mahasiswaId: mhs.id, komponenBiayaId: kb.id, tahunAkademikId: dto.tahunAkademikId }
        });

        if (!existing) {
          await this.prisma.tagihan.create({
            data: {
              mahasiswaId: mhs.id,
              tahunAkademikId: dto.tahunAkademikId,
              komponenBiayaId: kb.id,
              jenis: kb.jenis,
              jumlah: kb.nominal,
              sisaTagihan: kb.nominal,
              status: 'BELUM_LUNAS',
              jatuhTempo,
            }
          });
          count++;
        }
      }
    }
    return { message: `Berhasil generate ${count} tagihan baru.`, count };
  }
}
