import { Controller, Get, Post, Body } from '@nestjs/common';
import { PddiktiSyncService } from './pddikti-sync.service';

@Controller('pddikti-sync')
export class PddiktiSyncController {
  constructor(private readonly pddiktiSyncService: PddiktiSyncService) {}

  @Post('mahasiswa')
  async syncMahasiswa() {
    return this.pddiktiSyncService.syncMahasiswaData();
  }

  @Post('dosen')
  async syncDosen() {
    return this.pddiktiSyncService.syncDosenData();
  }

  @Post('matakuliah')
  async syncMataKuliah() {
    return this.pddiktiSyncService.syncMataKuliahData();
  }

  @Get('status')
  async getStatus() {
    return this.pddiktiSyncService.getStatus();
  }
}
