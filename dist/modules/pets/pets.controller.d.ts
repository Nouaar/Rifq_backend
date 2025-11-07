import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
export declare class PetsController {
    private readonly petsService;
    constructor(petsService: PetsService);
    create(ownerId: string, createPetDto: CreatePetDto): Promise<import("./schemas/pet.schema").Pet>;
    findAllByOwner(ownerId: string): Promise<import("./schemas/pet.schema").Pet[]>;
    findOne(petId: string): Promise<import("./schemas/pet.schema").Pet>;
    update(petId: string, updatePetDto: UpdatePetDto): Promise<import("./schemas/pet.schema").Pet>;
    delete(ownerId: string, petId: string): Promise<void>;
}
