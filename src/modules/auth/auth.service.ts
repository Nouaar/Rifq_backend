// src/modules/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../users/dto/create-user.dto';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /** Register a new user and send verification code */
  async register(
    email: string,
    name: string,
    password: string,
    role: UserRole = UserRole.OWNER,
  ): Promise<{ message: string }> {
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const user = new this.userModel({
      email,
      name,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationCode,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await user.save();
    await this.mailService.sendVerificationCode(email, verificationCode);

    return { message: 'Verification code sent to your email' };
  }

  /** Verify email with code */
  async verifyEmail(email: string, code: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');

    if (user.isVerified) return { message: 'Email already verified' };

    const now = new Date();
    if (
      !user.verificationCode ||
      user.verificationCode !== code ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < now
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  /** Login user and return access + refresh tokens */
  async login(
    email: string,
    password: string,
  ): Promise<{ user: UserDocument; tokens: Tokens }> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified)
      throw new UnauthorizedException('Please verify your email first');

    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };

    const accessTokenOptions: JwtSignOptions = { expiresIn: '15m' };
    const refreshTokenOptions: JwtSignOptions = { expiresIn: '7d' };

    const accessToken = this.jwtService.sign(payload, accessTokenOptions);
    const refreshToken = this.jwtService.sign(payload, refreshTokenOptions);

    user.hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    return { user, tokens: { accessToken, refreshToken } };
  }

  /** Refresh JWT tokens using a valid refresh token */
  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Access denied');

    const isTokenValid = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!isTokenValid) throw new UnauthorizedException('Invalid refresh token');

    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };
    const accessTokenOptions: JwtSignOptions = { expiresIn: '15m' };
    const refreshTokenOptions: JwtSignOptions = { expiresIn: '7d' };

    const newAccessToken = this.jwtService.sign(payload, accessTokenOptions);
    const newRefreshToken = this.jwtService.sign(payload, refreshTokenOptions);

    user.hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /** Revoke refresh token (logout) */
  async logout(userId: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    user.hashedRefreshToken = undefined;
    await user.save();

    return { message: 'Logged out successfully' };
  }

  /** Resend verification code */
  async resendVerificationCode(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('User already verified');

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newCode;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await this.mailService.sendVerificationCode(user.email, newCode);

    return { message: 'New verification code sent to your email' };
  }
}
