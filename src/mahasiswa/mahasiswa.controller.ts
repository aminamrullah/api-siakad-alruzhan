import { Controller, Get, Post, Put, Delete, Param, Body, Query, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { MahasiswaService } from './mahasiswa.service';
import { CreateMahasiswaDto, UpdateMahasiswaDto, MahasiswaQueryDto } from './mahasiswa.dto';

@Controller('mahasiswa')
export class MahasiswaController {
  constructor(private readonly mahasiswaService: MahasiswaService) { }

  @Get()
  findAll(@Query() query: MahasiswaQueryDto, @CurrentUser() user: any) {
    if (user?.role === 'KAPRODI' && user?.prodiId) {
      query.prodiId = user.prodiId;
    }
    return this.mahasiswaService.findAll({
      search: query.search,
      prodiId: query.prodiId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.mahasiswaService.findOne(id);
    if (user?.role === 'KAPRODI' && user?.prodiId && data.prodiId !== user.prodiId) {
      throw new UnauthorizedException('Anda tidak memiliki akses ke data mahasiswa ini');
    }
    return data;
  }

  @Post()
  create(@Body() dto: CreateMahasiswaDto) {
    return this.mahasiswaService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMahasiswaDto,
    @CurrentUser() user: any
  ) {
    if (user?.role === 'KAPRODI') {
      const data = await this.mahasiswaService.findOne(id);
      if (user?.prodiId && data.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak memiliki akses untuk mengubah data mahasiswa ini');
      }
      if (dto.prodiId && dto.prodiId !== user?.prodiId) {
        throw new UnauthorizedException('Tidak dapat memindahkan mahasiswa ke prodi lain');
      }
    }
    return this.mahasiswaService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    if (user?.role === 'KAPRODI') {
      const data = await this.mahasiswaService.findOne(id);
      if (user?.prodiId && data.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak memiliki akses untuk menghapus data mahasiswa ini');
      }
    }
    return this.mahasiswaService.delete(id);
  }
}
