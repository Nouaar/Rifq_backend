// src/modules/community/schemas/post.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true })
  userName: string;

  @Prop()
  userProfileImage?: string;

  @Prop({ required: true })
  petImage: string;

  @Prop()
  caption?: string;

  @Prop({ type: Map, of: Number, default: {} })
  reactions: Map<string, number>; // { like: 5, love: 3, haha: 2, angry: 0, cry: 1 }

  @Prop({ type: [{ userId: String, reactionType: String }], default: [] })
  userReactions: Array<{ userId: string; reactionType: string }>;

  @Prop({
    type: [
      {
        _id: { type: MongooseSchema.Types.ObjectId, auto: true },
        userId: String,
        userName: String,
        userProfileImage: String,
        userRole: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  comments: Array<{
    _id: MongooseSchema.Types.ObjectId;
    userId: string;
    userName: string;
    userProfileImage?: string;
    userRole?: string;
    text: string;
    createdAt: Date;
  }>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Index for efficient queries
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
