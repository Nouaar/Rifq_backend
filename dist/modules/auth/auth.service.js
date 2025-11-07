"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
const create_user_dto_1 = require("../users/dto/create-user.dto");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, mailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
        this.accessSecret =
            this.configService.getOrThrow('JWT_ACCESS_SECRET');
        this.refreshSecret =
            this.configService.getOrThrow('JWT_REFRESH_SECRET');
        this.accessExpiresIn =
            this.configService.get('JWT_ACCESS_EXPIRES_IN') ?? '15m';
        this.refreshExpiresIn =
            this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    }
    async hashToken(token) {
        return bcrypt.hash(token, 10);
    }
    async compareToken(token, hashed) {
        if (!hashed)
            return false;
        return bcrypt.compare(token, hashed);
    }
    createAccessSignOptions() {
        return {
            secret: this.accessSecret,
            expiresIn: this.accessExpiresIn,
        };
    }
    createRefreshSignOptions() {
        return {
            secret: this.refreshSecret,
            expiresIn: this.refreshExpiresIn,
        };
    }
    async generateTokensForUser(user) {
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
    async register(email, name, password, role = create_user_dto_1.UserRole.OWNER) {
        const normalized = email.toLowerCase();
        const existing = await this.usersService.findByEmail(normalized);
        if (existing)
            throw new common_1.BadRequestException('Email already registered');
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const createDto = {
            email: normalized,
            name,
            password: hashedPassword,
            role,
            isVerified: false,
            verificationCode,
            verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
        };
        await this.usersService.create(createDto);
        try {
            await this.mailService.sendVerificationCode(normalized, verificationCode);
        }
        catch (err) {
            if (err instanceof Error) {
                console.error('sendVerificationCode failed:', err.message);
            }
            else {
                console.error('sendVerificationCode failed (unknown error)');
            }
        }
        return { message: 'Verification code sent to your email' };
    }
    async verifyEmail(email, code) {
        const normalized = email.toLowerCase();
        const user = await this.usersService.findByEmail(normalized);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.isVerified)
            return { message: 'Email already verified' };
        const now = new Date();
        if (!user.verificationCode ||
            user.verificationCode !== code ||
            !user.verificationCodeExpires ||
            user.verificationCodeExpires < now) {
            throw new common_1.BadRequestException('Invalid or expired verification code');
        }
        await this.usersService.update(String(user._id), {
            isVerified: true,
            verificationCode: undefined,
            verificationCodeExpires: undefined,
        });
        return { message: 'Email verified successfully' };
    }
    async login(email, password) {
        const normalized = email.toLowerCase();
        const user = await this.usersService.findByEmail(normalized);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.isVerified)
            throw new common_1.UnauthorizedException('Please verify your email first');
        const tokens = await this.generateTokensForUser(user);
        const hashed = await this.hashToken(tokens.refreshToken);
        await this.usersService.updateRefreshToken(String(user._id), hashed);
        const safeUser = {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
            pets: user.pets,
        };
        return { user: safeUser, tokens };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.UnauthorizedException('Access denied');
        const isValid = await this.compareToken(refreshToken, user.hashedRefreshToken);
        if (!isValid)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        const tokens = await this.generateTokensForUser(user);
        const hashed = await this.hashToken(tokens.refreshToken);
        await this.usersService.updateRefreshToken(String(user._id), hashed);
        return tokens;
    }
    async logout(userId) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.usersService.updateRefreshToken(String(user._id), undefined);
        return { message: 'Logged out successfully' };
    }
    async resendVerificationCode(email) {
        const normalized = email.toLowerCase();
        const user = await this.usersService.findByEmail(normalized);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.isVerified)
            throw new common_1.BadRequestException('User already verified');
        if (user.verificationCodeExpires &&
            user.verificationCodeExpires > new Date()) {
            throw new common_1.BadRequestException('Verification code still valid. Please wait before requesting a new code.');
        }
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        await this.usersService.update(String(user._id), {
            verificationCode: newCode,
            verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
        });
        try {
            await this.mailService.sendVerificationCode(user.email, newCode);
        }
        catch (err) {
            if (err instanceof Error) {
                console.error('Failed to send verification email:', err.message);
            }
            else {
                console.error('Failed to send verification email (unknown error)');
            }
        }
        return { message: 'New verification code sent to your email' };
    }
    async getProfile(userId) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const safe = {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
            pets: user.pets,
            profileImage: user.profileImage,
        };
        return safe;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map