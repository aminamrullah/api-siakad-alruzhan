import { Module } from '@nestjs/common';
import { KegiatanService } from './kegiatan.service';
import { KegiatanController } from './kegiatan.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KegiatanController],
  providers: [KegiatanService],
})
export class KegiatanModule {}
