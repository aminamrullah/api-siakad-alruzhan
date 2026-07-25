import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { RuanganService } from './ruangan.service';

@Controller('ruangan')
export class RuanganController {
  constructor(private readonly ruanganService: RuanganService) {}

  @Get()
  findAll(@Query('page') page: string = '1', @Query('limit') limit: string = '10', @Query('search') search: string = '') {
    return this.ruanganService.findAll(+page, +limit, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ruanganService.findOne(id);
  }

  @Post()
  create(@Body() createDto: any) {
    return this.ruanganService.create(createDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.ruanganService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ruanganService.remove(id);
  }
}
