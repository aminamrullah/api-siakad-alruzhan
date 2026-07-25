import { Module } from '@nestjs/common';
import { AsdosService } from './asdos.service';
import { AsdosController } from './asdos.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AsdosController],
  providers: [AsdosService],
})
export class AsdosModule {}
