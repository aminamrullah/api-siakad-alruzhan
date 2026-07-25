import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { AlumniService } from './alumni.service';

@Controller('alumni')
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Post()
  create(@Body() createAlumniDto: any) {
    return this.alumniService.create(createAlumniDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    return this.alumniService.findAll(search, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alumniService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAlumniDto: any) {
    return this.alumniService.update(id, updateAlumniDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alumniService.remove(id);
  }
}
