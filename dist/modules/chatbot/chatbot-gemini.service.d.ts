import { ConfigService } from '@nestjs/config';
export declare class ChatbotGeminiService {
    private configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseURL;
    private readonly axiosInstance;
    private cachedModelName;
    private readonly maxRequestsPerMinute;
    private readonly requestWindowMs;
    private requestTimestamps;
    private requestQueue;
    private isProcessingQueue;
    constructor(configService: ConfigService);
    private waitForRateLimit;
    private processQueue;
    private getAvailableModel;
    private generateTextInternal;
    private analyzeImageInternal;
    generateText(prompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
        maxRetries?: number;
    }): Promise<string>;
    analyzeImage(imageData: string, prompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
        maxRetries?: number;
    }): Promise<string>;
}
