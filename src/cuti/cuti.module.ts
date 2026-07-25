import { Module } from '@nestjs/common';
import { CutiService } from './cuti.service';
import { CutiController } from './cuti.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CutiController],
  providers: [CutiService],
})
export class CutiModule {}
