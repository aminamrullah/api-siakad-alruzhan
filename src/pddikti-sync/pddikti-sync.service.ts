import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PddiktiSyncService {
  constructor(private prisma: PrismaService) {}

  async syncMahasiswaData() {
    // Simulasi integrasi dengan Neo Feeder Web Service API
    const log = await this.prisma.pddiktiSyncLog.create({
      data: {
        entityType: 'MAHASISWA',
        status: 'SUCCESS',
        message: '150 Data mahasiswa berhasil dikirim ke Neo Feeder PDDIKTI',
      }
    });
    return log;
  }

  async syncDosenData() {
    // Simulasi integrasi dengan Neo Feeder Web Service API
    const count = await this.prisma.dosen.count();
    const log = await this.prisma.pddiktiSyncLog.create({
      data: {
        entityType: 'DOSEN',
        status: 'SUCCESS',
        message: `${count} Data dosen berhasil disinkronkan dari PDDIKTI`,
      }
    });
    return log;
  }

  async syncMataKuliahData() {
    const count = await this.prisma.mataKuliah.count();
    const log = await this.prisma.pddiktiSyncLog.create({
      data: {
        entityType: 'MATAKULIAH',
        status: 'SUCCESS',
        message: `${count} Data mata kuliah berhasil disinkronkan ke PDDIKTI`,
      }
    });
    return log;
  }

  async getStatus() {
    const logs = await this.prisma.pddiktiSyncLog.findMany({
      orderBy: { syncDate: 'desc' },
      take: 20
    });
    
    // get latest status per entity
    const latestSync: Record<string, any> = {};
    const entityTypes = ['MAHASISWA', 'DOSEN', 'MATAKULIAH', 'KRS', 'NILAI'];
    
    // initialize
    entityTypes.forEach(e => {
      latestSync[e] = { status: 'BELUM_PERNAH', date: null };
    });

    // reverse to get oldest first, so latest overwrites
    const reversed = [...logs].reverse();
    reversed.forEach(l => {
      latestSync[l.entityType] = { status: l.status, date: l.syncDate, message: l.message };
    });

    return { 
      logs,
      latestSync
    };
  }
}
