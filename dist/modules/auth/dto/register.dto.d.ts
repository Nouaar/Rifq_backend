import { UserRole } from '../../users/dto/create-user.dto';
export declare class RegisterDto {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
}
