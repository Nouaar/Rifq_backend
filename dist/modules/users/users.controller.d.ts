import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    updateProfile(user: User, payload: UpdateProfileDto, file?: Express.Multer.File): Promise<User>;
    remove(id: string): Promise<void>;
    updateFcmToken(user: User, body: {
        fcmToken: string | null;
    }): Promise<{
        message: string;
    }>;
}
