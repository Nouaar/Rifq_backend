import { Model } from 'mongoose';
import { ChatbotGeminiService } from './chatbot-gemini.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserDocument } from '../users/schemas/user.schema';
import { PetDocument } from '../pets/schemas/pet.schema';
import { MedicalHistoryDocument } from '../pets/schemas/medical-history.schema';
import { ChatbotMessageDocument } from './schemas/chatbot-message.schema';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';
import { ChatbotImageAnalysisDto } from './dto/chatbot-image-analysis.dto';
import { ChatbotResponseDto } from './dto/chatbot-response.dto';
import { ChatbotHistoryResponseDto } from './dto/chatbot-history-response.dto';
export declare class ChatbotService {
    private readonly chatbotGeminiService;
    private readonly cloudinaryService;
    private readonly userModel;
    private readonly petModel;
    private readonly medicalHistoryModel;
    private readonly chatbotMessageModel;
    private readonly logger;
    constructor(chatbotGeminiService: ChatbotGeminiService, cloudinaryService: CloudinaryService, userModel: Model<UserDocument>, petModel: Model<PetDocument>, medicalHistoryModel: Model<MedicalHistoryDocument>, chatbotMessageModel: Model<ChatbotMessageDocument>);
    private getUserPetsWithHistory;
    private buildPetInformationString;
    private getConversationHistory;
    private buildConversationContext;
    private buildContextualPrompt;
    private buildDefaultPrompt;
    processMessage(userId: string, chatbotMessageDto: ChatbotMessageDto): Promise<ChatbotResponseDto>;
    private downloadImageAsBase64;
    private getPetPhotosForComparison;
    private buildImageAnalysisPrompt;
    private buildContextualPromptWithHistory;
    private buildDefaultPromptWithHistory;
    analyzeImage(userId: string, imageAnalysisDto: ChatbotImageAnalysisDto): Promise<ChatbotResponseDto>;
    getHistory(userId: string, limit?: number, offset?: number): Promise<ChatbotHistoryResponseDto>;
    clearHistory(userId: string): Promise<{
        message: string;
    }>;
}
