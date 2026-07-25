import { Module } from '@nestjs/common';
import { KuesionerEdomService } from './edom.service';
import { KuesionerEdomController } from './edom.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KuesionerEdomController],
  providers: [KuesionerEdomService],
})
export class EdomModule {}
