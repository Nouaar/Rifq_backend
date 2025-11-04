// src/modules/auth/auth.controller.ts
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService, Tokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { Request } from 'express';
import { User } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.name,
      registerDto.password,
      registerDto.role,
    );
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ user: User; tokens: Tokens }> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Req() req: Request & { user: { sub: string; refreshToken: string } },
  ): Promise<Tokens> {
    const { sub: userId, refreshToken } = req.user;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('verify')
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyDto.email, verifyDto.code);
  }
  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  async logout(@Req() req: Request & { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.authService.logout(userId);
  }
}
