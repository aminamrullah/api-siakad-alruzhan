import { CurrentUser } from '../auth/current-user.decorator';
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { KrsService } from './krs.service';

@Controller('krs')
export class KrsController {
  constructor(private readonly krsService: KrsService) {}

  @Get()
  findAll(
    @Query('mahasiswaId') mahasiswaId?: string,
    @Query('semester') semester?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.krsService.findAll({
      mahasiswaId,
      semester,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('mahasiswa/:mahasiswaId')
  findByMahasiswa(
    @Param('mahasiswaId') mahasiswaId: string,
    @Query('semester') semester?: string,
  ) {
    return this.krsService.findByMahasiswa(mahasiswaId, semester);
  }

  @Get('available/:mahasiswaId/:tahunAkademikId')
  getAvailableJadwal(
    @Param('mahasiswaId') mahasiswaId: string,
    @Param('tahunAkademikId') tahunAkademikId: string,
  ) {
    return this.krsService.getAvailableJadwal(mahasiswaId, tahunAkademikId);
  }

  @Post()
  create(@Body() dto: { mahasiswaId: string; jadwalId: string; semester: string }, @CurrentUser() user: any) {
    return this.krsService.create(dto, user);
  }

  @Put(':id/nilai')
  inputNilai(@Param('id') id: string, @Body() dto: { nilaiAkhir: number; grade: string }) {
    return this.krsService.inputNilai(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.krsService.delete(id, user);
  }
}
