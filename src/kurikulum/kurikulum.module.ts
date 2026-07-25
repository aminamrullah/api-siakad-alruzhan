import { Module } from '@nestjs/common';
import { KurikulumService } from './kurikulum.service';
import { KurikulumController } from './kurikulum.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KurikulumController],
  providers: [KurikulumService],
})
export class KurikulumModule {}
