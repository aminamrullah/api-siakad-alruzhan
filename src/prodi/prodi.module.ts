import { Module } from '@nestjs/common';
import { ProdiService } from './prodi.service';
import { ProdiController } from './prodi.controller';

@Module({
  providers: [ProdiService],
  controllers: [ProdiController],
  exports: [ProdiService],
})
export class ProdiModule {}
