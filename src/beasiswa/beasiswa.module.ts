import { Module } from '@nestjs/common';
import { BeasiswaService } from './beasiswa.service';
import { BeasiswaController } from './beasiswa.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BeasiswaController],
  providers: [BeasiswaService],
})
export class BeasiswaModule {}
