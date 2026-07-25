import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { MataKuliahService } from './mata-kuliah.service';

@Controller('mata-kuliah')
export class MataKuliahController {
  constructor(private readonly mataKuliahService: MataKuliahService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('kurikulumId') kurikulumId?: string,
    @CurrentUser() user?: any,
  ) {
    let prodiId = undefined;
    if (user?.role === 'KAPRODI' && user?.prodiId) {
      prodiId = user.prodiId;
    }
    return this.mataKuliahService.findAll({
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      prodiId,
      kurikulumId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mataKuliahService.findOne(id);
  }

  @Post()
  create(@Body() dto: { kode: string; nama: string; sks: number }) {
    return this.mataKuliahService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: { kode?: string; nama?: string; sks?: number }) {
    return this.mataKuliahService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.mataKuliahService.delete(id);
  }
}
