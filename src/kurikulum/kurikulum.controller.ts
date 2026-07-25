import { Controller, Get, Post, Body, Param, Put, Delete, Query, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { KurikulumService } from './kurikulum.service';

@Controller('kurikulum')
export class KurikulumController {
  constructor(private readonly kurikulumService: KurikulumService) {}

  @Post()
  create(@Body() createKurikulumDto: any, @CurrentUser() user: any) {
    if (user?.role === 'KAPRODI' && user?.prodiId) {
      if (createKurikulumDto.prodiId && createKurikulumDto.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Tidak dapat membuat kurikulum untuk prodi lain');
      }
      createKurikulumDto.prodiId = user.prodiId;
    }
    return this.kurikulumService.create(createKurikulumDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string, 
    @Query('page') page: string = '1', 
    @Query('limit') limit: string = '10',
    @Query('prodiId') queryProdiId?: string,
    @CurrentUser() user?: any
  ) {
    let prodiId = queryProdiId;
    if (user?.role === 'KAPRODI' && user?.prodiId) {
      prodiId = user.prodiId;
    }
    return this.kurikulumService.findAll(search, +page, +limit, prodiId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.kurikulumService.findOne(id);
    if (user?.role === 'KAPRODI' && user?.prodiId && data.prodiId !== user.prodiId) {
      throw new UnauthorizedException('Anda tidak memiliki akses ke kurikulum ini');
    }
    return data;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateKurikulumDto: any, @CurrentUser() user: any) {
    if (user?.role === 'KAPRODI') {
      const data = await this.kurikulumService.findOne(id);
      if (user.prodiId && data.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak memiliki akses untuk mengubah kurikulum ini');
      }
      if (updateKurikulumDto.prodiId && updateKurikulumDto.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Tidak dapat memindahkan kurikulum ke prodi lain');
      }
    }
    return this.kurikulumService.update(id, updateKurikulumDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    if (user?.role === 'KAPRODI') {
      const data = await this.kurikulumService.findOne(id);
      if (user.prodiId && data.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak memiliki akses untuk menghapus kurikulum ini');
      }
    }
    return this.kurikulumService.remove(id);
  }

  @Post(':id/mata-kuliah')
  async addMataKuliah(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    if (user?.role === 'KAPRODI') {
      const kurikulum = await this.kurikulumService.findOne(id);
      if (user.prodiId && kurikulum.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak memiliki akses ke kurikulum ini');
      }
    }
    return this.kurikulumService.addMataKuliah(id, data);
  }

  @Delete(':id/mata-kuliah/:mataKuliahId')
  async removeMataKuliah(@Param('id') id: string, @Param('mataKuliahId') mataKuliahId: string, @CurrentUser() user: any) {
    if (user?.role === 'KAPRODI') {
      const kurikulum = await this.kurikulumService.findOne(id);
      if (user.prodiId && kurikulum.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak memiliki akses ke kurikulum ini');
      }
    }
    return this.kurikulumService.removeMataKuliah(id, mataKuliahId);
  }
}
