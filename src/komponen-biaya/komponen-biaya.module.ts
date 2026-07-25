import { Module } from '@nestjs/common';
import { KomponenBiayaService } from './komponen-biaya.service';
import { KomponenBiayaController } from './komponen-biaya.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KomponenBiayaController],
  providers: [KomponenBiayaService],
})
export class KomponenBiayaModule {}
