import { Module } from '@nestjs/common';
import { PesanService } from './pesan.service';
import { PesanController } from './pesan.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PesanController],
  providers: [PesanService],
})
export class PesanModule {}
