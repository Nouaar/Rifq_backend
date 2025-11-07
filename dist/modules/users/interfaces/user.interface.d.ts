export interface IUser {
    _id?: string;
    email: string;
    name: string;
    password?: string;
    role: 'owner' | 'vet' | 'admin' | 'sitter';
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
    pets?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
