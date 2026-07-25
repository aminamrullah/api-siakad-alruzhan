import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { PmbService } from './pmb.service';
import { Public } from '../auth/public.decorator';

@Controller('pmb')
export class PmbController {
  constructor(private readonly pmbService: PmbService) {}

  @Public()
  @Post('register')
  register(@Body() data: any) {
    return this.pmbService.register(data);
  }
  
  @Public()
  @Get('pengaturan/active')
  getActivePengaturan() {
    return this.pmbService.getActivePengaturan();
  }

  @Get('pengaturan')
  getAllPengaturan() {
    return this.pmbService.getAllPengaturan();
  }

  @Post('pengaturan')
  createPengaturan(@Body() data: any) {
    return this.pmbService.createPengaturan(data);
  }

  @Patch('pengaturan/:id')
  updatePengaturan(@Param('id') id: string, @Body() data: any) {
    return this.pmbService.updatePengaturan(id, data);
  }

  @Get('applicants')
  findAll(@Query('status') status?: string) {
    return this.pmbService.findAll(status);
  }

  @Get('applicants/:id')
  findOne(@Param('id') id: string) {
    return this.pmbService.findOne(id);
  }

  @Patch('applicants/:id/approve')
  approve(@Param('id') id: string) {
    return this.pmbService.approve(id);
  }

  @Patch('applicants/:id/reject')
  reject(@Param('id') id: string) {
    return this.pmbService.reject(id);
  }
  
  @Public()
  @Patch('applicants/:id/upload-bukti')
  uploadBukti(@Param('id') id: string, @Body('buktiPembayaran') buktiPembayaran: string) {
    return this.pmbService.uploadBukti(id, buktiPembayaran);
  }

  @Patch('applicants/:id/verify-payment')
  verifyPayment(@Param('id') id: string) {
    return this.pmbService.verifyPayment(id);
  }
}
