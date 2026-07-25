import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { OrangtuaService } from './orangtua.service';

@Controller('orangtua')
export class OrangtuaController {
  constructor(private readonly orangtuaService: OrangtuaService) {}

  @Post()
  create(@Body() createOrangtuaDto: any) {
    return this.orangtuaService.create(createOrangtuaDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    return this.orangtuaService.findAll(search, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orangtuaService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrangtuaDto: any) {
    return this.orangtuaService.update(id, updateOrangtuaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orangtuaService.remove(id);
  }
}
