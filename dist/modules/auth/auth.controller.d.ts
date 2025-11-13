import { AuthService, Tokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Request } from 'express';
import { User } from '../users/schemas/user.schema';
import { GoogleLoginDto } from './dto/google-login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: Partial<import("../users/schemas/user.schema").UserDocument>;
        tokens: Tokens;
    }>;
    refresh(req: Request & {
        user: {
            sub: string;
        };
        body: {
            refreshToken: string;
        };
    }): Promise<Tokens>;
    logout(req: Request & {
        user: {
            sub: string;
        };
    }): Promise<{
        message: string;
    }>;
    verifyEmail(verifyDto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    getProfile(user: User): Promise<Partial<import("../users/schemas/user.schema").UserDocument>>;
    google(dto: GoogleLoginDto): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            profileImage: any;
            isVerified: any;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
}
