import { Module } from '@nestjs/common';
import { SKPIService } from './skpi.service';
import { SKPIController } from './skpi.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SKPIController],
  providers: [SKPIService],
})
export class SkpiModule {}
