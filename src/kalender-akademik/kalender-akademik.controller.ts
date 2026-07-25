import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { KalenderAkademikService } from './kalender-akademik.service';

@Controller('kalender-akademik')
export class KalenderAkademikController {
  constructor(private readonly kalenderService: KalenderAkademikService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.kalenderService.create(createDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    return this.kalenderService.findAll(search, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kalenderService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.kalenderService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kalenderService.remove(id);
  }
}
