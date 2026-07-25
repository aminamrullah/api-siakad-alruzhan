import { Module } from '@nestjs/common';
import { DosenPortalController } from './dosen-portal.controller';
import { DosenPortalService } from './dosen-portal.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DosenPortalController],
  providers: [DosenPortalService],
})
export class DosenPortalModule {}
