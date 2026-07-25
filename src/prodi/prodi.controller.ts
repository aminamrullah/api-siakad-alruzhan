import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProdiService } from './prodi.service';
import { Public } from '../auth/public.decorator';

@Controller('prodi')
export class ProdiController {
  constructor(private readonly prodiService: ProdiService) {}

  @Public()
  @Get()
  findAll() {
    return this.prodiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prodiService.findOne(id);
  }

  @Post()
  create(@Body() dto: { kode: string; nama: string; fakultas: string }) {
    return this.prodiService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: { kode?: string; nama?: string; fakultas?: string }) {
    return this.prodiService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prodiService.delete(id);
  }
}
