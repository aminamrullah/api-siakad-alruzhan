import { Module } from '@nestjs/common';
import { KrsStatusService } from './krs-status.service';
import { KrsStatusController } from './krs-status.controller';

@Module({
  controllers: [KrsStatusController],
  providers: [KrsStatusService],
  exports: [KrsStatusService],
})
export class KrsStatusModule {}
