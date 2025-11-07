// src/modules/pets/pets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(ownerId: string, createPetDto: CreatePetDto): Promise<Pet> {
    const owner = await this.userModel.findById(ownerId);
    if (!owner) throw new NotFoundException('Owner not found');

    const pet = await this.petModel.create({
      ...createPetDto,
      owner: new Types.ObjectId(ownerId),
    });

    owner.pets.push(pet._id);
    await owner.save();

    return pet;
  }

  async findAllByOwner(ownerId: string): Promise<Pet[]> {
    return this.petModel
      .find({ owner: ownerId })
      .populate('owner', 'name email');
  }

  async findOne(petId: string): Promise<Pet> {
    const pet = await this.petModel
      .findById(petId)
      .populate('owner', 'name email');
    if (!pet) throw new NotFoundException('Pet not found');
    return pet;
  }

  async update(petId: string, updatePetDto: UpdatePetDto): Promise<Pet> {
    const pet = await this.petModel
      .findByIdAndUpdate(petId, updatePetDto, { new: true })
      .exec();
    if (!pet) throw new NotFoundException('Pet not found');
    return pet;
  }

  async delete(petId: string, ownerId: string): Promise<void> {
    const pet = await this.petModel.findOneAndDelete({
      _id: petId,
      owner: ownerId,
    });
    if (!pet) throw new NotFoundException('Pet not found or not yours');

    await this.userModel.findByIdAndUpdate(ownerId, { $pull: { pets: petId } });
  }
}
