import { Document, Types } from 'mongoose';
export type ChatbotMessageDocument = ChatbotMessage & Document;
export declare class ChatbotMessage extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    role: string;
    content: string;
    imageUrl?: string;
    imagePrompt?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ChatbotMessageSchema: import("mongoose").Schema<ChatbotMessage, import("mongoose").Model<ChatbotMessage, any, any, any, Document<unknown, any, ChatbotMessage, any, {}> & ChatbotMessage & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatbotMessage, Document<unknown, {}, import("mongoose").FlatRecord<ChatbotMessage>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ChatbotMessage> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
