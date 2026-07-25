import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { TagihanService } from './tagihan.service';

@Controller('tagihan')
export class TagihanController {
  constructor(private readonly tagihanService: TagihanService) {}

  @Get()
  findAll(
    @Query('mahasiswaId') mahasiswaId?: string,
    @Query('status') status?: string,
    @Query('jenis') jenis?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tagihanService.findAll({
      mahasiswaId,
      status,
      jenis,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('mahasiswa/:mahasiswaId')
  findByMahasiswa(@Param('mahasiswaId') mahasiswaId: string) {
    return this.tagihanService.findByMahasiswa(mahasiswaId);
  }

  @Post()
  create(@Body() dto: any) {
    return this.tagihanService.create(dto);
  }

  /** Buat tagihan kolektif: satu/beberapa komponen untuk banyak mahasiswa */
  @Post('batch')
  createBatch(@Body() dto: {
    mahasiswaIds: string[];
    komponenBiayaIds: string[];
    jatuhTempo: string;
    tahunAkademikId?: string;
  }) {
    return this.tagihanService.createBatch(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: { status?: string; jumlah?: number; jatuhTempo?: string }) {
    return this.tagihanService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tagihanService.delete(id);
  }

  /** Generate tagihan massal otomatis dari Master Tarif */
  @Post('generate')
  generateTagihanMassal(@Body() dto: {
    tahunAkademikId: string;
    komponenBiayaIds?: string[];
    prodiId?: string;
    angkatan?: string;
    jalurMasuk?: string;
    jatuhTempo?: string;
  }) {
    return this.tagihanService.generateTagihanMassal(dto);
  }
}
