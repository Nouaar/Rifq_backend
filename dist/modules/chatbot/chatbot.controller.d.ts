import { User } from '../users/schemas/user.schema';
import { ChatbotService } from './chatbot.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';
import { ChatbotImageAnalysisDto } from './dto/chatbot-image-analysis.dto';
import { ChatbotResponseDto } from './dto/chatbot-response.dto';
import { ChatbotHistoryResponseDto } from './dto/chatbot-history-response.dto';
export declare class ChatbotController {
    private readonly chatbotService;
    constructor(chatbotService: ChatbotService);
    sendMessage(user: User, body: ChatbotMessageDto & {
        image?: string;
    }, imageFile?: Express.Multer.File): Promise<ChatbotResponseDto>;
    analyzeImage(user: User, body: {
        prompt?: string;
        image?: string;
    }, imageFile?: Express.Multer.File): Promise<ChatbotResponseDto>;
    analyzeImageBase64(user: User, imageAnalysisDto: ChatbotImageAnalysisDto): Promise<ChatbotResponseDto>;
    getHistory(user: User, limit: number, offset: number): Promise<ChatbotHistoryResponseDto>;
    clearHistory(user: User): Promise<{
        message: string;
    }>;
}
