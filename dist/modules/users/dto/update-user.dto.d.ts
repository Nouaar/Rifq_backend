import { CreateUserDto } from './create-user.dto';
declare const UpdateUserDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    pets?: string[];
    profileImage?: string;
    phoneNumber?: string;
    country?: string;
    city?: string;
    hasPhoto?: boolean;
    hasPets?: boolean;
}
export {};
