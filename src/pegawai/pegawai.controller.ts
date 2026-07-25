import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PegawaiService } from './pegawai.service';

@Controller('pegawai')
export class PegawaiController {
  constructor(private readonly pegawaiService: PegawaiService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('divisi') divisi?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pegawaiService.findAll({
      search,
      divisi,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pegawaiService.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.pegawaiService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.pegawaiService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.pegawaiService.delete(id);
  }
}
