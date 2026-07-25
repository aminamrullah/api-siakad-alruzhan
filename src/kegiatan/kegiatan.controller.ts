import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { KegiatanService } from './kegiatan.service';

@Controller('kegiatan')
export class KegiatanController {
  constructor(private readonly kegiatanService: KegiatanService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.kegiatanService.create(createDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '15') {
    return this.kegiatanService.findAll(search, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kegiatanService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.kegiatanService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kegiatanService.remove(id);
  }
}
