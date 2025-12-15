import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
export type PostDocument = Post & Document;
export declare class Post {
    userId: User;
    userName: string;
    userProfileImage?: string;
    userRole?: string;
    petImage: string;
    caption?: string;
    reactions: Map<string, number>;
    userReactions: Array<{
        userId: string;
        reactionType: string;
    }>;
    reports: string[];
    comments: Array<{
        _id: MongooseSchema.Types.ObjectId;
        userId: string;
        userName: string;
        userProfileImage?: string;
        userRole?: string;
        text: string;
        createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PostSchema: MongooseSchema<Post, import("mongoose").Model<Post, any, any, any, Document<unknown, any, Post, any, {}> & Post & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Post, Document<unknown, {}, import("mongoose").FlatRecord<Post>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Post> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
