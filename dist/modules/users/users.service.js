"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let UsersService = class UsersService {
    constructor(userModel, cloudinaryService) {
        this.userModel = userModel;
        this.cloudinaryService = cloudinaryService;
    }
    async create(createUserDto) {
        const createdUser = new this.userModel({
            ...createUserDto,
            balance: createUserDto.balance ?? 0,
            isVerified: createUserDto.isVerified ?? false,
        });
        return createdUser.save();
    }
    async findAll() {
        return this.userModel.find().exec();
    }
    async findOne(id) {
        const user = await this.userModel.findById(id).exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async update(id, updateUserDto) {
        const user = await this.userModel
            .findByIdAndUpdate(id, updateUserDto, { new: true })
            .exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async remove(id) {
        const user = await this.userModel.findByIdAndDelete(id).exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async findById(id) {
        return this.userModel.findById(id).exec();
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email }).exec();
    }
    async updateRefreshToken(userId, refreshToken) {
        const user = await this.userModel
            .findByIdAndUpdate(userId, { hashedRefreshToken: refreshToken }, { new: true })
            .exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateProfile(userId, update, file) {
        const payload = {};
        if (update.name !== undefined)
            payload.name = update.name;
        if (update.phoneNumber !== undefined)
            payload.phoneNumber = update.phoneNumber;
        if (update.country !== undefined)
            payload.country = update.country;
        if (update.city !== undefined)
            payload.city = update.city;
        if (update.hasPhoto !== undefined)
            payload.hasPhoto = update.hasPhoto;
        if (update.hasPets !== undefined)
            payload.hasPets = update.hasPets;
        if (file) {
            const user = await this.findById(userId);
            if (!user)
                throw new common_1.NotFoundException('User not found');
            if (user.profileImage) {
                const publicId = this.extractPublicId(user.profileImage);
                if (publicId) {
                    await this.cloudinaryService.deleteImage(publicId);
                }
            }
            const result = await this.cloudinaryService.uploadImage(file, 'users/profiles');
            payload.profileImage = result.secure_url;
            payload.hasPhoto = true;
        }
        const user = await this.userModel
            .findByIdAndUpdate(userId, payload, { new: true })
            .exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    extractPublicId(imageUrl) {
        const matches = imageUrl.match(/\/([^/]+)\.(jpg|jpeg|png|gif|webp)$/i);
        return matches ? matches[1] : null;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        cloudinary_service_1.CloudinaryService])
], UsersService);
//# sourceMappingURL=users.service.js.map