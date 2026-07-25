import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class KuesionerEdomService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.kuesionerEdom.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15) {
    const skip = (page - 1) * limit;
    
    // Very basic where clause, you can customize per model later
    const where = search ? { id: search } : {};

    const [data, total] = await Promise.all([
      this.prisma.kuesionerEdom.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.kuesionerEdom.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getSummary() {
    const edomList = await this.prisma.kuesionerEdom.findMany({
      include: {
        mataKuliah: true,
        dosen: { include: { user: { select: { name: true } } } }
      }
    });

    const grouped: Record<string, any> = {};
    
    edomList.forEach(e => {
      const key = `${e.dosenId}_${e.mataKuliahId}`;
      if (!grouped[key]) {
        grouped[key] = {
          dosenId: e.dosenId,
          dosenNama: e.dosen?.user?.name || '-',
          mataKuliahId: e.mataKuliahId,
          mataKuliahNama: e.mataKuliah?.nama || '-',
          kodeMk: e.mataKuliah?.kode || '-',
          jumlahResponden: 0,
          totalSkorPelayanan: 0,
          totalSkorMateri: 0,
          saranList: []
        };
      }
      
      grouped[key].jumlahResponden += 1;
      grouped[key].totalSkorPelayanan += e.skorPelayanan;
      grouped[key].totalSkorMateri += e.skorMateri;
      if (e.saran && e.saran.trim() !== '') {
        grouped[key].saranList.push(e.saran);
      }
    });

    const data = Object.values(grouped).map((g: any) => ({
      ...g,
      rataPelayanan: g.totalSkorPelayanan / g.jumlahResponden,
      rataMateri: g.totalSkorMateri / g.jumlahResponden
    }));

    // Sort by dosen then matakuliah
    data.sort((a, b) => a.dosenNama.localeCompare(b.dosenNama) || a.mataKuliahNama.localeCompare(b.mataKuliahNama));

    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.kuesionerEdom.findUnique({
      where: { id }
    });
    if (!data) throw new NotFoundException('Data tidak ditemukan');
    return data;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.kuesionerEdom.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.kuesionerEdom.delete({ where: { id } });
  }
}
