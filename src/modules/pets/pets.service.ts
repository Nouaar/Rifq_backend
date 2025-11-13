// src/modules/pets/pets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import {
  MedicalHistory,
  MedicalHistoryDocument,
} from './schemas/medical-history.schema';

@Injectable()
export class PetsService {
  constructor(
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(MedicalHistory.name)
    private medicalHistoryModel: Model<MedicalHistoryDocument>,
  ) {}

  async create(ownerId: string, createPetDto: CreatePetDto): Promise<Pet> {
    const owner = await this.userModel.findById(ownerId);
    if (!owner) throw new NotFoundException('Owner not found');

    const { medicalHistory, ...petData } = createPetDto;

    const pet = await this.petModel.create({
      ...petData,
      owner: new Types.ObjectId(ownerId),
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

  async findAllByOwner(ownerId: string): Promise<Pet[]> {
    return this.petModel
      .find({ owner: new Types.ObjectId(ownerId) })
      .populate('owner', 'name email')
      .populate('medicalHistory');
  }

  async findOne(petId: string): Promise<Pet> {
    const pet = await this.petModel
      .findById(petId)
      .populate('owner', 'name email')
      .populate('medicalHistory');
    if (!pet) throw new NotFoundException('Pet not found');
    return pet;
  }

  async update(petId: string, updatePetDto: UpdatePetDto): Promise<Pet> {
    const { medicalHistory, ...petUpdates } = updatePetDto;

    const pet = await this.petModel.findById(petId);
    if (!pet) throw new NotFoundException('Pet not found');

    const petUpdateEntries = Object.entries(petUpdates).filter(
      ([, value]) => value !== undefined,
    );

    if (petUpdateEntries.length > 0) {
      petUpdateEntries.forEach(([key, value]) => {
        (pet as unknown as Record<string, unknown>)[key] = value;
      });
      await pet.save();
    }

    if (medicalHistory) {
      const medicalHistoryUpdate: Record<string, unknown> = {};

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
        const updatedHistory = await this.medicalHistoryModel.findOneAndUpdate(
          { pet: pet._id },
          { ...medicalHistoryUpdate, pet: pet._id },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          },
        );

        if (!pet.medicalHistory) {
          pet.medicalHistory = updatedHistory._id;
          await pet.save();
        }
      }
    }

    return this.findOne(petId);
  }

  async delete(petId: string, ownerId: string): Promise<void> {
    const pet = await this.petModel.findOneAndDelete({
      _id: new Types.ObjectId(petId),
      owner: new Types.ObjectId(ownerId),
    });
    if (!pet) throw new NotFoundException('Pet not found or not yours');

    await this.userModel.findByIdAndUpdate(
      new Types.ObjectId(ownerId),
      { $pull: { pets: new Types.ObjectId(petId) } }
    );

    await this.medicalHistoryModel.findOneAndDelete({ pet: pet._id });
  }
}
