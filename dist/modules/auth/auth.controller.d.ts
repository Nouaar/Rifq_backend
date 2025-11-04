import { AuthService, Tokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Request } from 'express';
import { User } from '../users/schemas/user.schema';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: User;
        tokens: Tokens;
    }>;
    refresh(req: Request & {
        user: {
            sub: string;
            refreshToken: string;
        };
    }): Promise<Tokens>;
    verifyEmail(verifyDto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    logout(req: Request & {
        user: {
            sub: string;
        };
    }): Promise<{
        message: string;
    }>;
}
