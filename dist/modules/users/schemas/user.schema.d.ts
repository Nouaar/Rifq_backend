import { Document, Types } from 'mongoose';
export type UserDocument = User & Document;
export declare class User extends Document {
    _id: Types.ObjectId;
    email: string;
    phoneNumber?: string;
    name: string;
    password: string;
    profileImage?: string;
    role: string;
    balance: number;
    isVerified: boolean;
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
    bio?: string;
    pets: Types.ObjectId[];
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<User> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
