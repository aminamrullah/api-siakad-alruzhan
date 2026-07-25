import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { AsdosService } from './asdos.service';

@Controller('asdos')
export class AsdosController {
  constructor(private readonly asdosService: AsdosService) {}

  @Post()
  create(@Body() createAsdosDto: any) {
    return this.asdosService.create(createAsdosDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    return this.asdosService.findAll(search, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.asdosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAsdosDto: any) {
    return this.asdosService.update(id, updateAsdosDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.asdosService.remove(id);
  }
}
