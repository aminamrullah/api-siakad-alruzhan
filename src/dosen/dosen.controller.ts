import { Controller, Get, Post, Put, Delete, Param, Body, Query, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { DosenService } from './dosen.service';

@Controller('dosen')
export class DosenController {
  constructor(private readonly dosenService: DosenService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('homebaseId') homebaseId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    let effectiveHomebaseId = homebaseId;
    if (user?.role === 'KAPRODI' && user?.prodiId) {
      effectiveHomebaseId = user.prodiId;
    }
    
    return this.dosenService.findAll({
      search,
      homebaseId: effectiveHomebaseId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.dosenService.findOne(id);
    if (user?.role === 'KAPRODI' && user?.prodiId && data.homebaseId !== user.prodiId) {
      throw new UnauthorizedException('Anda tidak memiliki akses ke data dosen ini');
    }
    return data;
  }

  @Post()
  create(@Body() dto: any) {
    return this.dosenService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any
  ) {
    if (user?.role === 'KAPRODI') {
      const data = await this.dosenService.findOne(id);
      if (user.prodiId && data.homebaseId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak memiliki akses untuk mengubah data dosen ini');
      }
      if (dto.homebaseId && dto.homebaseId !== user.prodiId) {
        throw new UnauthorizedException('Tidak dapat memindahkan dosen ke prodi lain');
      }
    }
    return this.dosenService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    if (user?.role === 'KAPRODI') {
      const data = await this.dosenService.findOne(id);
      if (user.prodiId && data.homebaseId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak memiliki akses untuk menghapus dosen ini');
      }
    }
    return this.dosenService.delete(id);
  }
}
