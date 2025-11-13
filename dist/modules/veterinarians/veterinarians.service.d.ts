import { Model } from 'mongoose';
import { CreateVetDto } from './dto/create-vet.dto';
import { UpdateVetDto } from './dto/update-vet.dto';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { VeterinarianDocument } from './schemas/veterinarian.schema';
import { MailService } from '../mail/mail.service';
export declare class VeterinariansService {
    private readonly userModel;
    private readonly veterinarianModel;
    private readonly usersService;
    private readonly mailService;
    constructor(userModel: Model<UserDocument>, veterinarianModel: Model<VeterinarianDocument>, usersService: UsersService, mailService: MailService);
    create(createVetDto: CreateVetDto): Promise<UserDocument>;
    findAll(): Promise<UserDocument[]>;
    findOne(id: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    update(id: string, updateVetDto: UpdateVetDto): Promise<UserDocument>;
    remove(id: string): Promise<void>;
    convertUserToVet(userId: string, vetData: Omit<CreateVetDto, 'email' | 'name' | 'password'>): Promise<UserDocument>;
}
