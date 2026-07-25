import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query } from '@nestjs/common';
import { TahunAkademikService } from './tahun-akademik.service';
import { Public } from '../auth/public.decorator';

@Controller('tahun-akademik')
export class TahunAkademikController {
  constructor(private service: TahunAkademikService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(search, page ? +page : 1, limit ? +limit : 10);
  }

  @Public()
  @Get('aktif')
  getAktif() {
    return this.service.getAktif();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: { kode: string; nama: string; tahun: string; semester: string; isAktif?: boolean }) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Patch(':id/set-aktif')
  setAktif(@Param('id') id: string) {
    return this.service.setAktif(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
