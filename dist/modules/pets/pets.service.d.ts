import { Model } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { MedicalHistoryDocument } from './schemas/medical-history.schema';
export declare class PetsService {
    private petModel;
    private userModel;
    private medicalHistoryModel;
    constructor(petModel: Model<PetDocument>, userModel: Model<UserDocument>, medicalHistoryModel: Model<MedicalHistoryDocument>);
    create(ownerId: string, createPetDto: CreatePetDto): Promise<Pet>;
    findAllByOwner(ownerId: string): Promise<Pet[]>;
    findOne(petId: string): Promise<Pet>;
    update(petId: string, updatePetDto: UpdatePetDto): Promise<Pet>;
    delete(petId: string, ownerId: string): Promise<void>;
}
