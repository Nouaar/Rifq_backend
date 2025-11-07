// src/modules/users/interfaces/user.interface.ts
export interface IUser {
  _id?: string;

  // Basic info
  email: string;
  name: string;
  password?: string;

  // Role & account state
  role: 'owner' | 'vet' | 'admin' | 'sitter';
  balance?: number;
  isVerified?: boolean;

  // Verification & tokens
  verificationCode?: string;
  verificationCodeExpires?: Date;
  refreshToken?: string;
  hashedRefreshToken?: string;

  // Vet-specific fields (optional)
  specialization?: string;
  clinicName?: string;
  clinicAddress?: string;
  Location?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  phoneNumber?: string;
  bio?: string;
  profileImage?: string;

  // Relationships
  pets?: string[]; // array of Pet IDs

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}
