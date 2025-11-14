// src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { AuthService, Tokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { VerifyNewEmailDto } from './dto/verify-new-email.dto';
import { JwtRefreshGuard } from '../auth/guards/jwt-refresh.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.name,
      registerDto.password,
      registerDto.role,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req()
    req: Request & { user: { sub: string }; body: { refreshToken: string } },
  ): Promise<Tokens> {
    const userId = req.user.sub;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const refreshToken = req.body.refreshToken;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request & { user: { sub: string } }) {
    await this.authService.logout(req.user.sub);
    return { message: 'Logged out successfully' };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyDto.email, verifyDto.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(String(user._id ?? user.id));
  }

  @Post('google')
  async google(@Body() dto: GoogleLoginDto) {
    return this.authService.signInWithGoogle(dto.id_token);
  }

  @Patch('change-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request email change',
    description:
      'Request to change email address. Sends verification code to new email. Requires password confirmation.',
  })
  async changeEmail(
    @CurrentUser() user: User,
    @Body() changeEmailDto: ChangeEmailDto,
  ) {
    return this.authService.changeEmail(
      String(user._id ?? user.id),
      changeEmailDto,
    );
  }

  @Post('verify-new-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify new email',
    description:
      'Verify new email address with code. This will invalidate all refresh tokens and require login with new email.',
  })
  async verifyNewEmail(
    @CurrentUser() user: User,
    @Body() verifyDto: VerifyNewEmailDto,
  ) {
    return this.authService.verifyNewEmail(
      String(user._id ?? user.id),
      verifyDto,
    );
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description:
      'Change user password. This will invalidate all existing refresh tokens and require login again.',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      String(user._id ?? user.id),
      changePasswordDto,
    );
  }
}
