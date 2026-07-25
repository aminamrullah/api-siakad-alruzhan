import { Controller, Get, Post, Param, Body, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { KrsStatusService } from './krs-status.service';
import { PrismaService } from '../prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('krs-status')
export class KrsStatusController {
  constructor(
    private readonly krsStatusService: KrsStatusService,
    private prisma: PrismaService
  ) {}

  @Get('list/:tahunAkademikId')
  getStatusList(
    @Param('tahunAkademikId') tahunAkademikId: string,
    @Query('prodiId') queryProdiId?: string,
    @Query('statusPengajuan') statusPengajuan?: string,
    @CurrentUser() user?: any,
  ) {
    let prodiId = queryProdiId;
    if (user?.role === 'KAPRODI' && user?.prodiId) {
      prodiId = user.prodiId;
    }
    return this.krsStatusService.getStatusList(tahunAkademikId, prodiId, statusPengajuan);
  }

  @Get(':mahasiswaId/:tahunAkademikId')
  getStatus(
    @Param('mahasiswaId') mahasiswaId: string,
    @Param('tahunAkademikId') tahunAkademikId: string,
  ) {
    return this.krsStatusService.getStatus(mahasiswaId, tahunAkademikId);
  }

  @Post('buka-akses')
  bukaAksesKeuangan(
    @Body() dto: { mahasiswaId: string; tahunAkademikId: string; buka: boolean },
  ) {
    return this.krsStatusService.bukaAksesKeuangan(dto.mahasiswaId, dto.tahunAkademikId, dto.buka);
  }

  @Post('ajukan')
  ajukanKrs(
    @Body() dto: { mahasiswaId: string; tahunAkademikId: string },
    @CurrentUser() user: any
  ) {
    // Optional: verify user is the mahasiswa
    return this.krsStatusService.ajukanKrs(dto.mahasiswaId, dto.tahunAkademikId);
  }

  @Post('proses')
  async prosesPersetujuan(
    @Body() dto: { mahasiswaId: string; tahunAkademikId: string; disetujui: boolean; catatan?: string },
    @CurrentUser() user: any
  ) {
    if (user?.role === 'KAPRODI' && user?.prodiId) {
      const mahasiswa = await this.prisma.mahasiswa.findUnique({ where: { id: dto.mahasiswaId } });
      if (mahasiswa && mahasiswa.prodiId !== user.prodiId) {
        throw new UnauthorizedException('Anda tidak memiliki akses untuk menyetujui KRS mahasiswa ini');
      }
    }
    return this.krsStatusService.prosesPersetujuan(dto.mahasiswaId, dto.tahunAkademikId, dto.disetujui, dto.catatan, user?.sub);
  }
}
