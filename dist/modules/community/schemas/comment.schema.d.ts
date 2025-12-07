import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Post } from './post.schema';
export type CommentDocument = Comment & Document;
export declare class Comment {
    postId: Post;
    userId: User;
    userName: string;
    userProfileImage?: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CommentSchema: MongooseSchema<Comment, import("mongoose").Model<Comment, any, any, any, Document<unknown, any, Comment, any, {}> & Comment & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Comment, Document<unknown, {}, import("mongoose").FlatRecord<Comment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Comment> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
