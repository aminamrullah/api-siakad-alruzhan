import { Module } from '@nestjs/common';
import { SkripsiService } from './skripsi.service';
import { SkripsiController } from './skripsi.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SkripsiController],
  providers: [SkripsiService],
})
export class SkripsiModule {}
