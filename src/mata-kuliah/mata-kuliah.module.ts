import { Module } from '@nestjs/common';
import { MataKuliahService } from './mata-kuliah.service';
import { MataKuliahController } from './mata-kuliah.controller';

@Module({
  providers: [MataKuliahService],
  controllers: [MataKuliahController],
  exports: [MataKuliahService],
})
export class MataKuliahModule {}
