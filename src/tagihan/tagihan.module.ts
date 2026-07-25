import { Module } from '@nestjs/common';
import { TagihanService } from './tagihan.service';
import { TagihanController } from './tagihan.controller';

@Module({
  providers: [TagihanService],
  controllers: [TagihanController],
  exports: [TagihanService],
})
export class TagihanModule {}
