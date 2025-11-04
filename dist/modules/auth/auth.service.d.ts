import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../users/dto/create-user.dto';
export interface Tokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly userModel;
    private readonly jwtService;
    private readonly configService;
    private readonly mailService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService, configService: ConfigService, mailService: MailService);
    register(email: string, name: string, password: string, role?: UserRole): Promise<{
        message: string;
    }>;
    verifyEmail(email: string, code: string): Promise<{
        message: string;
    }>;
    login(email: string, password: string): Promise<{
        user: UserDocument;
        tokens: Tokens;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<Tokens>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    resendVerificationCode(email: string): Promise<{
        message: string;
    }>;
}
