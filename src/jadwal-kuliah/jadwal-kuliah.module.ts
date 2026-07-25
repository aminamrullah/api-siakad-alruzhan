import { Module } from '@nestjs/common';
import { JadwalKuliahService } from './jadwal-kuliah.service';
import { JadwalKuliahController } from './jadwal-kuliah.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JadwalKuliahController],
  providers: [JadwalKuliahService],
})
export class JadwalKuliahModule {}
