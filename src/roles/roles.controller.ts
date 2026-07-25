import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createDto: { name: string; permissions: string[] }) {
    return this.rolesService.create(createDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '15') {
    return this.rolesService.findAll(search, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: { name?: string; permissions?: string[] }) {
    return this.rolesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
