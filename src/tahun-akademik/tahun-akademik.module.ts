import { Module } from '@nestjs/common';
import { TahunAkademikService } from './tahun-akademik.service';
import { TahunAkademikController } from './tahun-akademik.controller';

@Module({
  providers: [TahunAkademikService],
  controllers: [TahunAkademikController],
  exports: [TahunAkademikService],
})
export class TahunAkademikModule {}
