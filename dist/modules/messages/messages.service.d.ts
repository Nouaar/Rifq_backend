import { Model } from 'mongoose';
import { ConversationDocument } from './schemas/conversation.schema';
import { MessageDocument } from './schemas/message.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FcmService } from '../fcm/fcm.service';
export declare class MessagesService {
    private readonly conversationModel;
    private readonly messageModel;
    private readonly userModel;
    private readonly cloudinaryService;
    private readonly fcmService;
    constructor(conversationModel: Model<ConversationDocument>, messageModel: Model<MessageDocument>, userModel: Model<UserDocument>, cloudinaryService: CloudinaryService, fcmService: FcmService);
    getOrCreateConversation(userId: string, participantId: string): Promise<ConversationDocument>;
    getConversations(userId: string): Promise<ConversationDocument[]>;
    getMessages(conversationId: string, userId: string): Promise<MessageDocument[]>;
    sendMessage(userId: string, createMessageDto: CreateMessageDto, audioFile?: Express.Multer.File): Promise<MessageDocument>;
    markAsRead(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    updateMessage(messageId: string, userId: string, content: string): Promise<MessageDocument>;
    deleteMessage(messageId: string, userId: string): Promise<MessageDocument>;
    deleteConversation(conversationId: string, userId: string): Promise<void>;
}
