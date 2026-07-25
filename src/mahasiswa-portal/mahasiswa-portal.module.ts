import { Module } from '@nestjs/common';
import { MahasiswaPortalController } from './mahasiswa-portal.controller';
import { MahasiswaPortalService } from './mahasiswa-portal.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MahasiswaPortalController],
  providers: [MahasiswaPortalService],
})
export class MahasiswaPortalModule {}
