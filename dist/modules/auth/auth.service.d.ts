import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../users/dto/create-user.dto';
export interface Tokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly mailService;
    private readonly accessSecret;
    private readonly refreshSecret;
    private readonly accessExpiresIn;
    private readonly refreshExpiresIn;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, mailService: MailService);
    private hashToken;
    private compareToken;
    private createAccessSignOptions;
    private createRefreshSignOptions;
    private generateTokensForUser;
    register(email: string, name: string, password: string, role?: UserRole): Promise<{
        message: string;
    }>;
    verifyEmail(email: string, code: string): Promise<{
        message: string;
    }>;
    login(email: string, password: string): Promise<{
        user: Partial<UserDocument>;
        tokens: Tokens;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<Tokens>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    resendVerificationCode(email: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<Partial<UserDocument>>;
}
