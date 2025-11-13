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
exports.VeterinariansService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const users_service_1 = require("../users/users.service");
const user_schema_1 = require("../users/schemas/user.schema");
const veterinarian_schema_1 = require("./schemas/veterinarian.schema");
const mail_service_1 = require("../mail/mail.service");
const bcrypt = __importStar(require("bcrypt"));
let VeterinariansService = class VeterinariansService {
    constructor(userModel, veterinarianModel, usersService, mailService) {
        this.userModel = userModel;
        this.veterinarianModel = veterinarianModel;
        this.usersService = usersService;
        this.mailService = mailService;
    }
    async create(createVetDto) {
        const existingUser = await this.usersService.findByEmail(createVetDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(createVetDto.password, 10);
        const vetData = {
            ...createVetDto,
            password: hashedPassword,
            role: 'vet',
            isVerified: false,
            balance: 0,
        };
        const createdUser = await new this.userModel(vetData).save();
        const veterinarian = new this.veterinarianModel({
            user: createdUser._id,
            licenseNumber: createVetDto.licenseNumber,
            clinicName: createVetDto.clinicName,
            clinicAddress: createVetDto.clinicAddress,
            specializations: createVetDto.specializations || [],
            yearsOfExperience: createVetDto.yearsOfExperience,
            latitude: createVetDto.latitude,
            longitude: createVetDto.longitude,
            bio: createVetDto.bio,
        });
        await veterinarian.save();
        return createdUser;
    }
    async findAll() {
        const veterinarians = await this.veterinarianModel.find().populate('user').exec();
        return veterinarians.map((vet) => {
            const user = vet.user;
            if (!user || !('_id' in user)) {
                throw new common_1.NotFoundException('User not populated correctly');
            }
            return user;
        });
    }
    async findOne(id) {
        const vet = await this.veterinarianModel.findOne({ user: id }).populate('user').exec();
        if (!vet) {
            throw new common_1.NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        const user = vet.user;
        if (!user || !('_id' in user)) {
            throw new common_1.NotFoundException('User not populated correctly');
        }
        return user;
    }
    async findByEmail(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user || user.role !== 'vet') {
            return null;
        }
        const vet = await this.veterinarianModel.findOne({ user: user._id }).populate('user').exec();
        if (!vet) {
            return null;
        }
        const populatedUser = vet.user;
        return populatedUser && '_id' in populatedUser ? populatedUser : null;
    }
    async update(id, updateVetDto) {
        const vet = await this.veterinarianModel
            .findOneAndUpdate({ user: id }, { $set: updateVetDto }, { new: true })
            .populate('user')
            .exec();
        if (!vet) {
            throw new common_1.NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        const user = vet.user;
        if (!user || !('_id' in user)) {
            throw new common_1.NotFoundException('User not populated correctly');
        }
        return user;
    }
    async remove(id) {
        const result = await this.veterinarianModel
            .findOneAndDelete({ user: id })
            .exec();
        if (!result) {
            throw new common_1.NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        await this.userModel.findByIdAndUpdate(id, { $set: { role: 'owner' } }).exec();
    }
    async convertUserToVet(userId, vetData) {
        const user = await this.usersService.findOne(userId);
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        let veterinarian = await this.veterinarianModel.findOne({ user: userId }).exec();
        if (veterinarian) {
            veterinarian = await this.veterinarianModel
                .findOneAndUpdate({ user: userId }, {
                $set: {
                    licenseNumber: vetData.licenseNumber,
                    clinicName: vetData.clinicName,
                    clinicAddress: vetData.clinicAddress,
                    specializations: vetData.specializations || [],
                    yearsOfExperience: vetData.yearsOfExperience,
                    latitude: vetData.latitude,
                    longitude: vetData.longitude,
                    bio: vetData.bio,
                },
            }, { new: true })
                .populate('user')
                .exec();
        }
        else {
            const vetRecord = new this.veterinarianModel({
                user: userId,
                licenseNumber: vetData.licenseNumber,
                clinicName: vetData.clinicName,
                clinicAddress: vetData.clinicAddress,
                specializations: vetData.specializations || [],
                yearsOfExperience: vetData.yearsOfExperience,
                latitude: vetData.latitude,
                longitude: vetData.longitude,
                bio: vetData.bio,
            });
            veterinarian = await vetRecord.save();
            await veterinarian.populate('user');
            const user = await this.usersService.findOne(userId);
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
            await this.userModel.findByIdAndUpdate(userId, {
                $set: {
                    role: 'vet',
                    isVerified: false,
                    verificationCode,
                    verificationCodeExpires,
                },
            }).exec();
            console.log(`[Vet Conversion] Sending verification email to ${user.email} with code: ${verificationCode}`);
            try {
                await this.mailService.sendVerificationCode(user.email, verificationCode);
                console.log(`[Vet Conversion] Verification email sent successfully to ${user.email}`);
            }
            catch (err) {
                if (err instanceof Error) {
                    console.error('Failed to send verification email during vet conversion:', err.message);
                    console.error('Error stack:', err.stack);
                }
                else {
                    console.error('Failed to send verification email during vet conversion (unknown error):', err);
                }
            }
        }
        const updatedUser = await this.usersService.findOne(userId);
        return updatedUser;
    }
};
exports.VeterinariansService = VeterinariansService;
exports.VeterinariansService = VeterinariansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(veterinarian_schema_1.Veterinarian.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService,
        mail_service_1.MailService])
], VeterinariansService);
//# sourceMappingURL=veterinarians.service.js.map