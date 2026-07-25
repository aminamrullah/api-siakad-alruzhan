import { CurrentUser } from '../auth/current-user.decorator';
import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { PesanService } from './pesan.service';

@Controller('pesan')
export class PesanController {
  constructor(private readonly service: PesanService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '15', @CurrentUser() user?: any) {
    return this.service.findAll(search, +page, +limit, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
