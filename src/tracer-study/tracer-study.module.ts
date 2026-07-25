import { Module } from '@nestjs/common';
import { TracerStudyService } from './tracer-study.service';
import { TracerStudyController } from './tracer-study.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TracerStudyController],
  providers: [TracerStudyService],
})
export class TracerStudyModule {}
