import { Module } from '@nestjs/common';
import { OrangtuaService } from './orangtua.service';
import { OrangtuaController } from './orangtua.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrangtuaController],
  providers: [OrangtuaService],
})
export class OrangtuaModule {}
