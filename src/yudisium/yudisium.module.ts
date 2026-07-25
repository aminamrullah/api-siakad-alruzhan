import { Module } from '@nestjs/common';
import { YudisiumService } from './yudisium.service';
import { YudisiumController } from './yudisium.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YudisiumController],
  providers: [YudisiumService],
})
export class YudisiumModule {}
