import { Module } from '@nestjs/common';
import { PengajuanDispensasiService } from './pengajuan-dispensasi.service';
import { PengajuanDispensasiController } from './pengajuan-dispensasi.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PengajuanDispensasiController],
  providers: [PengajuanDispensasiService],
})
export class PengajuanDispensasiModule {}
