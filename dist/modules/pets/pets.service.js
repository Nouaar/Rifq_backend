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
exports.PetsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const pet_schema_1 = require("./schemas/pet.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let PetsService = class PetsService {
    constructor(petModel, userModel) {
        this.petModel = petModel;
        this.userModel = userModel;
    }
    async create(ownerId, createPetDto) {
        const owner = await this.userModel.findById(ownerId);
        if (!owner)
            throw new common_1.NotFoundException('Owner not found');
        const pet = await this.petModel.create({
            ...createPetDto,
            owner: new mongoose_2.Types.ObjectId(ownerId),
        });
        owner.pets.push(pet._id);
        await owner.save();
        return pet;
    }
    async findAllByOwner(ownerId) {
        return this.petModel
            .find({ owner: ownerId })
            .populate('owner', 'name email');
    }
    async findOne(petId) {
        const pet = await this.petModel
            .findById(petId)
            .populate('owner', 'name email');
        if (!pet)
            throw new common_1.NotFoundException('Pet not found');
        return pet;
    }
    async update(petId, updatePetDto) {
        const pet = await this.petModel
            .findByIdAndUpdate(petId, updatePetDto, { new: true })
            .exec();
        if (!pet)
            throw new common_1.NotFoundException('Pet not found');
        return pet;
    }
    async delete(petId, ownerId) {
        const pet = await this.petModel.findOneAndDelete({
            _id: petId,
            owner: ownerId,
        });
        if (!pet)
            throw new common_1.NotFoundException('Pet not found or not yours');
        await this.userModel.findByIdAndUpdate(ownerId, { $pull: { pets: petId } });
    }
};
exports.PetsService = PetsService;
exports.PetsService = PetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(pet_schema_1.Pet.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], PetsService);
//# sourceMappingURL=pets.service.js.map