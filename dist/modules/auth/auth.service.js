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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const config_1 = require("@nestjs/config");
const mail_service_1 = require("../mail/mail.service");
const user_schema_1 = require("../users/schemas/user.schema");
const create_user_dto_1 = require("../users/dto/create-user.dto");
let AuthService = class AuthService {
    constructor(userModel, jwtService, configService, mailService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
    }
    async register(email, name, password, role = create_user_dto_1.UserRole.OWNER) {
        const existing = await this.userModel.findOne({ email }).exec();
        if (existing)
            throw new common_1.BadRequestException('Email already registered');
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const user = new this.userModel({
            email,
            name,
            password: hashedPassword,
            role,
            isVerified: false,
            verificationCode,
            verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
        });
        await user.save();
        await this.mailService.sendVerificationCode(email, verificationCode);
        return { message: 'Verification code sent to your email' };
    }
    async verifyEmail(email, code) {
        const user = await this.userModel.findOne({ email }).exec();
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
        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();
        return { message: 'Email verified successfully' };
    }
    async login(email, password) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.isVerified)
            throw new common_1.UnauthorizedException('Please verify your email first');
        const payload = {
            sub: String(user._id),
            email: user.email,
            role: user.role,
        };
        const accessTokenOptions = { expiresIn: '15m' };
        const refreshTokenOptions = { expiresIn: '7d' };
        const accessToken = this.jwtService.sign(payload, accessTokenOptions);
        const refreshToken = this.jwtService.sign(payload, refreshTokenOptions);
        user.hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await user.save();
        return { user, tokens: { accessToken, refreshToken } };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.hashedRefreshToken)
            throw new common_1.UnauthorizedException('Access denied');
        const isTokenValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
        if (!isTokenValid)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        const payload = {
            sub: String(user._id),
            email: user.email,
            role: user.role,
        };
        const accessTokenOptions = { expiresIn: '15m' };
        const refreshTokenOptions = { expiresIn: '7d' };
        const newAccessToken = this.jwtService.sign(payload, accessTokenOptions);
        const newRefreshToken = this.jwtService.sign(payload, refreshTokenOptions);
        user.hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
        await user.save();
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
    async logout(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.hashedRefreshToken = undefined;
        await user.save();
        return { message: 'Logged out successfully' };
    }
    async resendVerificationCode(email) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.isVerified)
            throw new common_1.BadRequestException('User already verified');
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = newCode;
        user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await this.mailService.sendVerificationCode(user.email, newCode);
        return { message: 'New verification code sent to your email' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map