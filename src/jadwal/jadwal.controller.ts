import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { JadwalService } from './jadwal.service';

@Controller('jadwal')
export class JadwalController {
  constructor(private readonly jadwalService: JadwalService) {}

  @Get()
  findAll(
    @Query('hari') hari?: string,
    @Query('dosenId') dosenId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.jadwalService.findAll({
      hari,
      dosenId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jadwalService.findOne(id);
  }

  @Post()
  create(@Body() dto: { mataKuliahId: string; dosenId: string; ruanganId: string; hari: string; waktuMulai: string; waktuSelesai: string }) {
    return this.jadwalService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.jadwalService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.jadwalService.delete(id);
  }
}
