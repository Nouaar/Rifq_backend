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
const medical_history_schema_1 = require("./schemas/medical-history.schema");
let PetsService = class PetsService {
    constructor(petModel, userModel, medicalHistoryModel) {
        this.petModel = petModel;
        this.userModel = userModel;
        this.medicalHistoryModel = medicalHistoryModel;
    }
    async create(ownerId, createPetDto) {
        const owner = await this.userModel.findById(ownerId);
        if (!owner)
            throw new common_1.NotFoundException('Owner not found');
        const { medicalHistory, ...petData } = createPetDto;
        const pet = await this.petModel.create({
            ...petData,
            owner: new mongoose_2.Types.ObjectId(ownerId),
        });
        owner.pets.push(pet._id);
        await owner.save();
        const history = await this.medicalHistoryModel.create({
            ...(medicalHistory ?? {}),
            pet: pet._id,
        });
        pet.medicalHistory = history._id;
        await pet.save();
        return this.findOne(pet._id.toHexString());
    }
    async findAllByOwner(ownerId) {
        return this.petModel
            .find({ owner: new mongoose_2.Types.ObjectId(ownerId) })
            .populate('owner', 'name email')
            .populate('medicalHistory');
    }
    async findOne(petId) {
        const pet = await this.petModel
            .findById(petId)
            .populate('owner', 'name email')
            .populate('medicalHistory');
        if (!pet)
            throw new common_1.NotFoundException('Pet not found');
        return pet;
    }
    async update(petId, updatePetDto) {
        const { medicalHistory, ...petUpdates } = updatePetDto;
        const pet = await this.petModel.findById(petId);
        if (!pet)
            throw new common_1.NotFoundException('Pet not found');
        const petUpdateEntries = Object.entries(petUpdates).filter(([, value]) => value !== undefined);
        if (petUpdateEntries.length > 0) {
            petUpdateEntries.forEach(([key, value]) => {
                pet[key] = value;
            });
            await pet.save();
        }
        if (medicalHistory) {
            const medicalHistoryUpdate = {};
            if (medicalHistory.vaccinations !== undefined) {
                medicalHistoryUpdate.vaccinations = medicalHistory.vaccinations;
            }
            if (medicalHistory.chronicConditions !== undefined) {
                medicalHistoryUpdate.chronicConditions = medicalHistory.chronicConditions;
            }
            if (medicalHistory.currentMedications !== undefined) {
                medicalHistoryUpdate.currentMedications = medicalHistory.currentMedications;
            }
            if (Object.keys(medicalHistoryUpdate).length > 0) {
                const updatedHistory = await this.medicalHistoryModel.findOneAndUpdate({ pet: pet._id }, { ...medicalHistoryUpdate, pet: pet._id }, {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                });
                if (!pet.medicalHistory) {
                    pet.medicalHistory = updatedHistory._id;
                    await pet.save();
                }
            }
        }
        return this.findOne(petId);
    }
    async delete(petId, ownerId) {
        const pet = await this.petModel.findOneAndDelete({
            _id: new mongoose_2.Types.ObjectId(petId),
            owner: new mongoose_2.Types.ObjectId(ownerId),
        });
        if (!pet)
            throw new common_1.NotFoundException('Pet not found or not yours');
        await this.userModel.findByIdAndUpdate(new mongoose_2.Types.ObjectId(ownerId), { $pull: { pets: new mongoose_2.Types.ObjectId(petId) } });
        await this.medicalHistoryModel.findOneAndDelete({ pet: pet._id });
    }
};
exports.PetsService = PetsService;
exports.PetsService = PetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(pet_schema_1.Pet.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(medical_history_schema_1.MedicalHistory.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], PetsService);
//# sourceMappingURL=pets.service.js.map