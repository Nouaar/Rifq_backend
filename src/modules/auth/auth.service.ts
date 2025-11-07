// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateUserDto, UserRole } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    // Fail fast if missing
    this.accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    // read expirations as strings (env var)
    this.accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    this.refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
  }

  // ---------- Helpers ----------
  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  private async compareToken(
    token: string,
    hashed: string | undefined,
  ): Promise<boolean> {
    if (!hashed) return false;
    return bcrypt.compare(token, hashed);
  }

  private createAccessSignOptions(): JwtSignOptions {
    return {
      secret: this.accessSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: this.accessExpiresIn as any,
    };
  }

  private createRefreshSignOptions(): JwtSignOptions {
    return {
      secret: this.refreshSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: this.refreshExpiresIn as any,
    };
  }

  private async generateTokensForUser(user: UserDocument): Promise<Tokens> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, this.createAccessSignOptions()),
      this.jwtService.signAsync(payload, this.createRefreshSignOptions()),
    ]);

    return { accessToken, refreshToken };
  }

  // ---------- Public API ----------
  async register(
    email: string,
    name: string,
    password: string,
    role: UserRole = UserRole.OWNER,
  ): Promise<{ message: string }> {
    const normalized = email.toLowerCase();

    const existing = await this.usersService.findByEmail(normalized);
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const createDto: CreateUserDto = {
      email: normalized,
      name,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationCode,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
    } as unknown as CreateUserDto;

    await this.usersService.create(createDto);

    // best-effort email sending; log error but don't block registration
    try {
      await this.mailService.sendVerificationCode(normalized, verificationCode);
    } catch (err: unknown) {
      // type-safe logging
      if (err instanceof Error) {
        console.error('sendVerificationCode failed:', err.message);
      } else {
        console.error('sendVerificationCode failed (unknown error)');
      }
    }

    return { message: 'Verification code sent to your email' };
  }

  async verifyEmail(email: string, code: string): Promise<{ message: string }> {
    const normalized = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalized);
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

    await this.usersService.update(String(user._id), {
      isVerified: true,
      verificationCode: undefined,
      verificationCodeExpires: undefined,
    } as Partial<CreateUserDto>);

    return { message: 'Email verified successfully' };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: Partial<UserDocument>; tokens: Tokens }> {
    const normalized = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalized);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // password exists on UserDocument per schema
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified)
      throw new UnauthorizedException('Please verify your email first');

    const tokens = await this.generateTokensForUser(user);

    // store hashed refresh token
    const hashed = await this.hashToken(tokens.refreshToken);
    await this.usersService.updateRefreshToken(String(user._id), hashed);

    // return a safe user object (strip sensitive fields)
    const safeUser = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      pets: user.pets,
      // add other public fields you want to expose
    } as Partial<UserDocument>;

    return { user: safeUser, tokens };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Access denied');

    // compare provided refresh token with hashed stored one
    const isValid = await this.compareToken(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.generateTokensForUser(user);

    // replace hashed refresh token
    const hashed = await this.hashToken(tokens.refreshToken);
    await this.usersService.updateRefreshToken(String(user._id), hashed);

    return tokens;
  }

  async logout(userId: string): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.usersService.updateRefreshToken(String(user._id), undefined);
    return { message: 'Logged out successfully' };
  }

  async resendVerificationCode(email: string): Promise<{ message: string }> {
    const normalized = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalized);
    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('User already verified');

    // Prevent spamming resend if a code is still valid
    if (
      user.verificationCodeExpires &&
      user.verificationCodeExpires > new Date()
    ) {
      throw new BadRequestException(
        'Verification code still valid. Please wait before requesting a new code.',
      );
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.usersService.update(String(user._id), {
      verificationCode: newCode,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
    } as Partial<CreateUserDto>);

    try {
      await this.mailService.sendVerificationCode(user.email, newCode);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Failed to send verification email:', err.message);
      } else {
        console.error('Failed to send verification email (unknown error)');
      }
    }

    return { message: 'New verification code sent to your email' };
  }

  async getProfile(userId: string): Promise<Partial<UserDocument>> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // remove sensitive fields
    const safe = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      pets: user.pets,
      profileImage: user.profileImage,
    } as Partial<UserDocument>;

    return safe;
  }
}
