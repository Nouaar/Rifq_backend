export declare enum UserRole {
    OWNER = "owner",
    VET = "vet",
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
}
