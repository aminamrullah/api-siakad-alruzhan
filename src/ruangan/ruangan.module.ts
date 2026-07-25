import { Module } from '@nestjs/common';
import { RuanganController } from './ruangan.controller';
import { RuanganService } from './ruangan.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RuanganController],
  providers: [RuanganService]
})
export class RuanganModule {}
