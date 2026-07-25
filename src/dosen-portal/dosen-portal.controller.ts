import { Controller, Get, Post, Put, Body, Param, Req, Query, Delete } from '@nestjs/common';
import { DosenPortalService } from './dosen-portal.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('dosen-portal')
export class DosenPortalController {
  constructor(private readonly service: DosenPortalService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('sub') userId: string, @Req() req: any) {
    const role = req.user?.role || '';
    return this.service.getDashboard(userId, role);
  }

  // Pengampu: Jadwal & Kelas
  @Get('jadwal')
  getJadwalMengajar(@CurrentUser('sub') userId: string, @Query('semester') semester?: string) {
    return this.service.getJadwalMengajar(userId, semester);
  }

  @Get('kelas/:id')
  getDetailKelas(@CurrentUser('sub') userId: string, @Param('id') jadwalId: string) {
    return this.service.getDetailKelas(userId, jadwalId);
  }

  // Pengampu: Agenda & Presensi
  @Post('kelas/:id/agenda')
  buatAgenda(@CurrentUser('sub') userId: string, @Param('id') jadwalId: string, @Body() dto: any) {
    return this.service.buatAgenda(userId, jadwalId, dto);
  }

  @Get('agenda/:id')
  getDetailAgenda(@CurrentUser('sub') userId: string, @Param('id') agendaId: string) {
    return this.service.getDetailAgenda(userId, agendaId);
  }

  @Delete('agenda/:id')
  hapusAgenda(@CurrentUser('sub') userId: string, @Param('id') agendaId: string) {
    return this.service.hapusAgenda(userId, agendaId);
  }

  @Put('agenda/:id/presensi')
  simpanPresensi(@CurrentUser('sub') userId: string, @Param('id') agendaId: string, @Body() dto: { kehadiran: any[] }) {
    return this.service.simpanPresensi(userId, agendaId, dto.kehadiran);
  }

  @Put('kelas/:id/nilai')
  simpanNilaiKolektif(@CurrentUser('sub') userId: string, @Param('id') jadwalId: string, @Body() dto: { nilai: { krsId: string, absensi: number, tugas: number, uts: number, uas: number }[] }) {
    return this.service.simpanNilaiKolektif(userId, jadwalId, dto.nilai);
  }

  // Dosen Wali: Perwalian
  @Get('perwalian')
  getMahasiswaPerwalian(@CurrentUser('sub') userId: string) {
    return this.service.getMahasiswaPerwalian(userId);
  }

  @Get('perwalian/:id')
  getDetailPerwalian(@CurrentUser('sub') userId: string, @Param('id') mhsId: string) {
    return this.service.getDetailPerwalian(userId, mhsId);
  }

  @Put('perwalian/validasi-krs')
  validasiKrs(@CurrentUser('sub') userId: string, @Body() dto: { krsIds: string[], status: 'DISETUJUI' | 'DITOLAK', catatan?: string }) {
    return this.service.validasiKrs(userId, dto.krsIds, dto.status, dto.catatan);
  }

  // Tambahan Phase 3
  @Get('profil')
  getProfil(@CurrentUser('sub') userId: string) {
    return this.service.getProfil(userId);
  }

  @Get('skripsi')
  getSkripsi(@CurrentUser('sub') userId: string) {
    return this.service.getSkripsi(userId);
  }

  @Get('skripsi/:id')
  getSkripsiDetail(@CurrentUser('sub') userId: string, @Param('id') skripsiId: string) {
    return this.service.getSkripsiDetail(userId, skripsiId);
  }

  @Put('skripsi/logbook/:id/validasi')
  validasiLogbook(
    @CurrentUser('sub') userId: string,
    @Param('id') logbookId: string,
    @Body() dto: { status: 'DIVALIDASI' | 'REVISI'; catatanDosen?: string },
  ) {
    return this.service.validasiLogbook(userId, logbookId, dto);
  }

  @Put('skripsi/ujian/:id/nilai')
  inputNilaiSidang(
    @CurrentUser('sub') userId: string,
    @Param('id') ujianId: string,
    @Body() dto: any,
  ) {
    return this.service.inputNilaiSidang(userId, ujianId, dto);
  }

  @Get('edom')
  getEdom(@CurrentUser('sub') userId: string) {
    return this.service.getEdom(userId);
  }
}
