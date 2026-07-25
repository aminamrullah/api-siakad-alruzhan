import { Controller, Get, Post, Body, Param, Put, Delete, Query, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SkripsiService } from './skripsi.service';

@Controller('skripsi')
export class SkripsiController {
  constructor(private readonly skripsiService: SkripsiService) {}

  // CRUD dasar (Admin/BAAK)
  @Post()
  create(@Body() createDto: any) {
    return this.skripsiService.create(createDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '15',
    @Query('status') status?: string,
    @Query('prodiId') queryProdiId?: string,
    @CurrentUser() user?: any,
  ) {
    let prodiId = queryProdiId;
    if (user?.role === 'KAPRODI' && user?.prodiId) {
      prodiId = user.prodiId;
    }
    return this.skripsiService.findAll(search, +page, +limit, status, prodiId);
  }

  @Get('statistik')
  getStatistik() {
    return this.skripsiService.getStatistik();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skripsiService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.skripsiService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skripsiService.remove(id);
  }

  // Kaprodi: Approve / Reject judul
  @Put(':id/approve-judul')
  async approveJudul(
    @Param('id') id: string,
    @Body() dto: { pembimbing1Id: string; pembimbing2Id?: string; catatan?: string },
    @CurrentUser() user: any
  ) {
    if (user?.role === 'KAPRODI') {
      const skripsi = await this.skripsiService.findOne(id);
      if (user.prodiId && skripsi.mahasiswa.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak berhak menyetujui judul ini');
      }
    }
    return this.skripsiService.approveJudul(id, dto);
  }

  @Put(':id/reject-judul')
  async rejectJudul(@Param('id') id: string, @Body() dto: { catatan: string }, @CurrentUser() user: any) {
    if (user?.role === 'KAPRODI') {
      const skripsi = await this.skripsiService.findOne(id);
      if (user.prodiId && skripsi.mahasiswa.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak berhak menolak judul ini');
      }
    }
    return this.skripsiService.rejectJudul(id, dto);
  }

  // Admin: Jadwal ujian
  @Post(':id/ujian')
  jadwalkanUjian(@Param('id') skripsiId: string, @Body() dto: any) {
    return this.skripsiService.jadwalkanUjian(skripsiId, dto);
  }

  // Admin/Dosen Penguji: Input nilai
  @Put('ujian/:ujianId/nilai')
  inputNilaiUjian(@Param('ujianId') ujianId: string, @Body() dto: any) {
    return this.skripsiService.inputNilaiUjian(ujianId, dto);
  }

  // Pustakawan: Validasi dokumen final
  @Put(':id/finalisasi/validasi')
  validasiFinalisasi(
    @Param('id') skripsiId: string,
    @Body() dto: { status: 'DISETUJUI' | 'DITOLAK'; catatan?: string },
  ) {
    return this.skripsiService.validasiFinalisasi(skripsiId, dto);
  }
}
