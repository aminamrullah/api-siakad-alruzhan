import { Module } from '@nestjs/common';
import { PddiktiSyncController } from './pddikti-sync.controller';
import { PddiktiSyncService } from './pddikti-sync.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PddiktiSyncController],
  providers: [PddiktiSyncService, PrismaService]
})
export class PddiktiSyncModule {}
