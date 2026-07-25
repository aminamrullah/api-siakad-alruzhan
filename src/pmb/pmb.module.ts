import { Module } from '@nestjs/common';
import { PmbController } from './pmb.controller';
import { PmbService } from './pmb.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PmbController],
  providers: [PmbService]
})
export class PmbModule {}
