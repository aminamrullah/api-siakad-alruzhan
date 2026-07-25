import { Controller, Post, Get, Put, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    const user = await this.authService.validateUser(signInDto.email, signInDto.password);
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }
    return this.authService.login(user);
  }

    @Get('profile')
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Put('change-password')
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(userId, body.oldPassword, body.newPassword);
  }

  @Put('update-profile')
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() body: { name?: string; telepon?: string; alamat?: string },
  ) {
    return this.authService.updateProfile(userId, body);
  }
}
