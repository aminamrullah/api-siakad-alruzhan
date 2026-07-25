import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { CutiService } from './cuti.service';

@Controller('cuti')
export class CutiController {
  constructor(private readonly cutiService: CutiService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.cutiService.create(createDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '15') {
    return this.cutiService.findAll(search, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cutiService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.cutiService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cutiService.remove(id);
  }
}
