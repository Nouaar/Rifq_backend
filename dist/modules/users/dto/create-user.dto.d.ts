export declare enum UserRole {
    OWNER = "owner",
    VET = "vet",
    ADMIN = "admin",
    SITTER = "sitter"
}
export declare class CreateUserDto {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
    balance?: number;
    isVerified?: boolean;
    verificationCode?: string;
    verificationCodeExpires?: Date;
    refreshToken?: string;
    hashedRefreshToken?: string;
    specialization?: string;
    clinicName?: string;
    clinicAddress?: string;
    Location?: string;
    licenseNumber?: string;
    yearsOfExperience?: number;
    phoneNumber?: string;
    bio?: string;
    profileImage?: string;
}
