import { Controller, Get, Post, Delete, Body, Param, Query, Put } from '@nestjs/common';
import { MahasiswaPortalService } from './mahasiswa-portal.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('mahasiswa-portal')
export class MahasiswaPortalController {
  constructor(private readonly service: MahasiswaPortalService) { }

  @Get('profil')
  getProfil(@CurrentUser('sub') userId: string) {
    return this.service.getProfil(userId);
  }

  @Put('profil')
  updateProfil(@CurrentUser('sub') userId: string, @Body() dto: any) {
    return this.service.updateProfil(userId, dto);
  }

  @Get('dashboard')
  getDashboard(@CurrentUser('sub') userId: string) {
    return this.service.getDashboard(userId);
  }

  @Get('krs')
  getKrs(@CurrentUser('sub') userId: string, @Query('semester') semester?: string) {
    return this.service.getKrs(userId, semester);
  }

  @Post('krs')
  ajukanKrs(@CurrentUser('sub') userId: string, @Body() dto: { jadwalId: string; semester: string }) {
    return this.service.ajukanKrs(userId, dto);
  }

  @Delete('krs/:id')
  hapusKrs(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.hapusKrs(userId, id);
  }

  @Get('khs')
  getKhs(@CurrentUser('sub') userId: string, @Query('semester') semester?: string) {
    return this.service.getKhs(userId, semester);
  }

  @Get('transkrip')
  getTranskrip(@CurrentUser('sub') userId: string) {
    return this.service.getTranskrip(userId);
  }

  @Get('krs-remidial')
  getKrsRemidial(@CurrentUser('sub') userId: string) {
    return this.service.getKrsRemidial(userId);
  }

  @Get('jadwal')
  getJadwal(@CurrentUser('sub') userId: string, @Query('semester') semester?: string) {
    return this.service.getJadwal(userId, semester);
  }

  @Get('jadwal-tersedia')
  getJadwalTersedia(@CurrentUser('sub') userId: string, @Query('semester') semester?: string) {
    return this.service.getJadwalTersedia(userId, semester);
  }

  @Get('tagihan')
  getTagihan(@CurrentUser('sub') userId: string) {
    return this.service.getTagihan(userId);
  }

  @Get('pembayaran')
  getPembayaran(@CurrentUser('sub') userId: string) {
    return this.service.getPembayaran(userId);
  }

  @Get('cuti')
  getCuti(@CurrentUser('sub') userId: string) {
    return this.service.getCuti(userId);
  }

  @Post('cuti')
  ajukanCuti(@CurrentUser('sub') userId: string, @Body() dto: { semester: string; alasan: string; dokumenPendukung?: string }) {
    return this.service.ajukanCuti(userId, dto);
  }

  @Get('skripsi/syarat')
  cekSyaratSkripsi(@CurrentUser('sub') userId: string) {
    return this.service.cekSyaratSkripsi(userId);
  }

  @Get('skripsi/detail')
  getSkripsiDetail(@CurrentUser('sub') userId: string) {
    return this.service.getSkripsiDetail(userId);
  }

  @Get('skripsi')
  getSkripsi(@CurrentUser('sub') userId: string) {
    return this.service.getSkripsi(userId);
  }

  @Post('skripsi')
  ajukanSkripsi(
    @CurrentUser('sub') userId: string,
    @Body() dto: { judul: string; abstrak?: string; proposalFileUrl?: string },
  ) {
    return this.service.ajukanSkripsi(userId, dto);
  }

  @Get('skripsi/logbooks')
  getLogbooks(@CurrentUser('sub') userId: string, @Query('skripsiId') skripsiId: string) {
    return this.service.getLogbooks(userId, skripsiId);
  }

  @Post('skripsi/logbook')
  ajukanLogbook(
    @CurrentUser('sub') userId: string,
    @Body() dto: { skripsiId: string; catatanMahasiswa: string; tanggal?: string },
  ) {
    return this.service.ajukanLogbook(userId, dto);
  }

  @Post('skripsi/daftar-ujian')
  daftarUjian(
    @CurrentUser('sub') userId: string,
    @Body() dto: { skripsiId: string; tipe: 'SEMINAR_PROPOSAL' | 'SIDANG_AKHIR'; draftFileUrl?: string },
  ) {
    return this.service.daftarUjian(userId, dto);
  }

  @Post('skripsi/upload-final')
  uploadFinalSkripsi(
    @CurrentUser('sub') userId: string,
    @Body() dto: { skripsiId: string; fileUrl: string },
  ) {
    return this.service.uploadFinalSkripsi(userId, dto);
  }

  @Get('cetak/krs')
  getCetakKrs(@CurrentUser('sub') userId: string, @Query('semester') semester: string) {
    return this.service.getCetakKrs(userId, semester);
  }

  @Get('cetak/kartu-ujian')
  getCetakKartuUjian(
    @CurrentUser('sub') userId: string,
    @Query('semester') semester: string,
    @Query('jenis') jenis: 'UTS' | 'UAS',
  ) {
    return this.service.getCetakKartuUjian(userId, semester, jenis);
  }

  @Get('cetak/keuangan')
  getCetakKeuangan(@CurrentUser('sub') userId: string) {
    return this.service.getCetakKeuangan(userId);
  }

  @Get('edom-target')
  getEdomTarget(@CurrentUser('sub') userId: string) {
    return this.service.getEdomTarget(userId);
  }

  @Post('edom')
  ajukanEdom(@CurrentUser('sub') userId: string, @Body() dto: { dosenId: string; mataKuliahId: string; skorPelayanan: number; skorMateri: number; saran?: string }) {
    return this.service.ajukanEdom(userId, dto);
  }

  @Get('kegiatan')
  getKegiatan(@CurrentUser('sub') userId: string) {
    return this.service.getKegiatan(userId);
  }

  @Post('kegiatan')
  daftarKegiatan(@CurrentUser('sub') userId: string, @Body() dto: { kegiatanId: string }) {
    return this.service.daftarKegiatan(userId, dto.kegiatanId);
  }

  @Get('beasiswa')
  getBeasiswa(@CurrentUser('sub') userId: string) {
    return this.service.getBeasiswa(userId);
  }

  @Get('ktm')
  getKtm(@CurrentUser('sub') userId: string) {
    return this.service.getKtm(userId);
  }

  @Get('yudisium')
  getYudisium(@CurrentUser('sub') userId: string) {
    return this.service.getYudisium(userId);
  }

  @Post('yudisium')
  daftarYudisium(@CurrentUser('sub') userId: string) {
    return this.service.daftarYudisium(userId);
  }
}