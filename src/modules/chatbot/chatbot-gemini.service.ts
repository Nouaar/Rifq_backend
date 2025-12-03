// src/modules/chatbot/chatbot-gemini.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string; // base64 encoded image
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      role?: string;
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
    index?: number;
  }>;
  error?: {
    message: string;
    code: number;
    status?: string;
    details?: Array<{
      '@type'?: string;
      retryDelay?: string | { seconds?: number };
      [key: string]: any;
    }>;
  };
  usageMetadata?: {
    promptTokenCount?: number;
    totalTokenCount?: number;
    promptTokensDetails?: Array<{
      modality?: string;
      tokenCount?: number;
    }>;
    thoughtsTokenCount?: number;
  };
  modelVersion?: string;
  responseId?: string;
}

/**
 * Dedicated Gemini Service for Chatbot
 * Uses separate API key to avoid rate limiting conflicts with other AI features
 */
@Injectable()
export class ChatbotGeminiService {
  private readonly logger = new Logger(ChatbotGeminiService.name);
  private readonly apiKey: string;
  private readonly baseURL = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly axiosInstance: AxiosInstance;
  private cachedModelName: string | null = null;

  // Rate limiting: Free tier allows 2 requests per minute
  private readonly maxRequestsPerMinute = 2;
  private readonly requestWindowMs = 60000; // 1 minute
  private requestTimestamps: number[] = [];
  private requestQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: Error) => void;
    prompt: string;
    imageData?: string;
    options: { temperature?: number; maxTokens?: number; maxRetries?: number };
  }> = [];
  private isProcessingQueue = false;

  constructor(private configService: ConfigService) {
    // Use dedicated chatbot API key, fallback to main GEMINI_API_KEY if not set
    this.apiKey =
      this.configService.get<string>('GEMINI_CHATBOT_API_KEY') ||
      this.configService.get<string>('GEMINI_API_KEY') ||
      '';

    if (!this.apiKey) {
      this.logger.warn(
        'GEMINI_CHATBOT_API_KEY and GEMINI_API_KEY not found in environment variables',
      );
    } else if (
      this.apiKey === this.configService.get<string>('GEMINI_API_KEY')
    ) {
      this.logger.warn(
        'GEMINI_CHATBOT_API_KEY not set, using shared GEMINI_API_KEY (may cause rate limiting)',
      );
    } else {
      this.logger.log('Using dedicated GEMINI_CHATBOT_API_KEY for chatbot');
    }

    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Wait for rate limit before making request
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.requestWindowMs,
    );

    // If we've made max requests, wait until the oldest request is outside the window
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = this.requestWindowMs - (now - oldestRequest);

      if (waitTime > 0) {
        this.logger.log(
          `Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s before next request...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Process queued requests sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) break;

      try {
        const result = request.imageData
          ? await this.analyzeImageInternal(
              request.imageData,
              request.prompt,
              request.options,
            )
          : await this.generateTextInternal(request.prompt, request.options);
        request.resolve(result);
      } catch (error) {
        request.reject(error as Error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get the best available Gemini model
   */
  private async getBestModel(): Promise<string> {
    // Try models in order of preference
    const models = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
    ];

    for (const model of models) {
      try {
        const url = `${this.baseURL}/models/${model}?key=${this.apiKey}`;
        await this.axiosInstance.get(url, { timeout: 5000 });
        this.logger.log(`Using Gemini model: ${model}`);
        return model;
      } catch (error) {
        // Model not available, try next
        continue;
      }
    }

    // Fallback to default
    this.logger.warn('No preferred model available, using gemini-pro');
    return 'gemini-pro';
  }

  /**
   * Get model name with caching
   */
  private async getModelName(): Promise<string> {
    if (!this.cachedModelName) {
      this.cachedModelName = await this.getBestModel();
    }
    return this.cachedModelName;
  }

  /**
   * Internal method to generate text (bypasses queue)
   */
  private async generateTextInternal(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      maxRetries?: number;
    } = {},
  ): Promise<string> {
    const {
      temperature = 0.7,
      maxTokens = 500,
      maxRetries = 3,
    } = options;

    if (!this.apiKey) {
      throw new Error('GEMINI_CHATBOT_API_KEY is not configured');
    }

    await this.waitForRateLimit();

    const modelName = await this.getModelName();
    const url = `${this.baseURL}/models/${modelName}:generateContent?key=${this.apiKey}`;

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.post<GeminiResponse>(
          url,
          requestBody,
        );

        if (response.data.error) {
          throw new Error(
            `Gemini API error: ${response.data.error.message} (code: ${response.data.error.code})`,
          );
        }

        const text =
          response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
          'No response generated';

        return text;
      } catch (error) {
        lastError = error as Error;
        this.logger.error(
          `Chatbot Gemini API request failed (attempt ${attempt}/${maxRetries}):`,
          error instanceof Error ? error.message : String(error),
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * attempt),
          );
        }
      }
    }

    throw lastError || new Error('Failed to generate text after retries');
  }

  /**
   * Internal method to analyze image (bypasses queue)
   */
  private async analyzeImageInternal(
    imageData: string,
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      maxRetries?: number;
    } = {},
  ): Promise<string> {
    const {
      temperature = 0.7,
      maxTokens = 500,
      maxRetries = 3,
    } = options;

    if (!this.apiKey) {
      throw new Error('GEMINI_CHATBOT_API_KEY is not configured');
    }

    await this.waitForRateLimit();

    // Use vision model for image analysis
    const modelName = 'gemini-1.5-flash';
    const url = `${this.baseURL}/models/${modelName}:generateContent?key=${this.apiKey}`;

    // Extract base64 data and mime type
    let base64Data: string;
    let mimeType: string;

    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid base64 image format');
      }
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      base64Data = imageData;
      mimeType = 'image/jpeg';
    }

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.post<GeminiResponse>(
          url,
          requestBody,
        );

        if (response.data.error) {
          throw new Error(
            `Gemini API error: ${response.data.error.message} (code: ${response.data.error.code})`,
          );
        }

        const text =
          response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
          'No response generated';

        return text;
      } catch (error) {
        lastError = error as Error;
        this.logger.error(
          `Chatbot Gemini image analysis failed (attempt ${attempt}/${maxRetries}):`,
          error instanceof Error ? error.message : String(error),
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * attempt),
          );
        }
      }
    }

    throw lastError || new Error('Failed to analyze image after retries');
  }

  /**
   * Generate text response from prompt (queued)
   */
  async generateText(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      maxRetries?: number;
    } = {},
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        resolve,
        reject,
        prompt,
        options,
      });
      this.processQueue();
    });
  }

  /**
   * Analyze image with prompt (queued)
   */
  async analyzeImage(
    imageData: string,
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      maxRetries?: number;
    } = {},
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        resolve,
        reject,
        prompt,
        imageData,
        options,
      });
      this.processQueue();
    });
  }
}
