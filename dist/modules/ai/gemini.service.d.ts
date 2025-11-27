import { ConfigService } from '@nestjs/config';
export declare class GeminiService {
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
    private makeApiRequest;
    generateText(prompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
        maxRetries?: number;
    }): Promise<string>;
    analyzeImage(imageBase64: string, prompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
        maxRetries?: number;
    }): Promise<string>;
}
