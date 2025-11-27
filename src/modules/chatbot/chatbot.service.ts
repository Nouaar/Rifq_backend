// src/modules/chatbot/chatbot.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GeminiService } from '../ai/gemini.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserDocument } from '../users/schemas/user.schema';
import { Pet, PetDocument } from '../pets/schemas/pet.schema';
import {
  MedicalHistory,
  MedicalHistoryDocument,
} from '../pets/schemas/medical-history.schema';
import {
  ChatbotMessage,
  ChatbotMessageDocument,
} from './schemas/chatbot-message.schema';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';
import { ChatbotImageAnalysisDto } from './dto/chatbot-image-analysis.dto';
import { ChatbotResponseDto } from './dto/chatbot-response.dto';
import {
  ChatbotHistoryResponseDto,
  ChatbotMessageItemDto,
} from './dto/chatbot-history-response.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Pet.name)
    private readonly petModel: Model<PetDocument>,
    @InjectModel(MedicalHistory.name)
    private readonly medicalHistoryModel: Model<MedicalHistoryDocument>,
    @InjectModel(ChatbotMessage.name)
    private readonly chatbotMessageModel: Model<ChatbotMessageDocument>,
  ) {}

  /**
   * Get user's pets with full medical history
   */
  private async getUserPetsWithHistory(
    userId: string,
  ): Promise<
    Array<{ pet: PetDocument; medicalHistory: MedicalHistoryDocument | null }>
  > {
    // Convert userId string to ObjectId for proper querying
    const ownerObjectId = new Types.ObjectId(userId);

    const pets = await this.petModel
      .find({ owner: ownerObjectId })
      .populate('medicalHistory')
      .limit(10) // Get up to 10 pets
      .exec();

    this.logger.log(`Found ${pets.length} pets for user ${userId}`);
    if (pets.length > 0) {
      const petNames = (pets as PetDocument[]).map((p) => p.name).join(', ');
      this.logger.log(`Pet names: ${petNames}`);
    }

    const petsWithHistory = await Promise.all(
      (pets as PetDocument[]).map(async (pet) => {
        let medicalHistory: MedicalHistoryDocument | null = null;
        if (pet.medicalHistory) {
          medicalHistory = await this.medicalHistoryModel.findById(
            pet.medicalHistory,
          );
        }
        return { pet, medicalHistory };
      }),
    );

    this.logger.log(
      `Returning ${petsWithHistory.length} pets with history for user ${userId}`,
    );
    return petsWithHistory;
  }

  /**
   * Build comprehensive pet information string for prompts
   */
  private buildPetInformationString(
    petsWithHistory: Array<{
      pet: PetDocument;
      medicalHistory: MedicalHistoryDocument | null;
    }>,
  ): string {
    if (petsWithHistory.length === 0) {
      this.logger.warn('No pets found for user - returning empty pet info');
      return '\n\nNo pets registered yet.';
    }

    this.logger.log(
      `Building pet info string for ${petsWithHistory.length} pets`,
    );

    let petInfo = '';
    for (const { pet, medicalHistory } of petsWithHistory) {
      petInfo += `\n\n**${pet.name}**`;
      petInfo += `\n- Species: ${pet.species}`;
      if (pet.breed) {
        petInfo += `\n- Breed: ${pet.breed}`;
      }
      if (pet.age !== undefined && pet.age !== null) {
        petInfo += `\n- Age: ${pet.age} years`;
      }
      if (pet.gender) {
        petInfo += `\n- Gender: ${pet.gender}`;
      }
      if (pet.color) {
        petInfo += `\n- Color: ${pet.color}`;
      }
      if (pet.weight !== undefined && pet.weight !== null) {
        petInfo += `\n- Weight: ${pet.weight.toFixed(1)} kg`;
      }
      if (pet.height !== undefined && pet.height !== null) {
        petInfo += `\n- Height: ${pet.height.toFixed(1)} cm`;
      }
      if (pet.microchipId) {
        petInfo += `\n- Microchip ID: ${pet.microchipId}`;
      }

      // Add medical history
      if (medicalHistory) {
        if (
          medicalHistory.vaccinations &&
          medicalHistory.vaccinations.length > 0
        ) {
          petInfo += `\n- Vaccinations: ${medicalHistory.vaccinations.join(', ')}`;
        } else {
          petInfo += `\n- Vaccinations: None recorded (may need core vaccines)`;
        }

        if (
          medicalHistory.chronicConditions &&
          medicalHistory.chronicConditions.length > 0
        ) {
          petInfo += `\n- Chronic Conditions: ${medicalHistory.chronicConditions.join(', ')}`;
        }

        if (
          medicalHistory.currentMedications &&
          medicalHistory.currentMedications.length > 0
        ) {
          const meds = medicalHistory.currentMedications
            .map((m) => `${m.name} (${m.dosage})`)
            .join(', ');
          petInfo += `\n- Current Medications: ${meds}`;
        }
      } else {
        petInfo += `\n- Medical History: Not available`;
      }
    }

    return petInfo;
  }

  /**
   * Get conversation history for a user (last N messages)
   */
  private async getConversationHistory(
    userId: string,
    limit: number = 10,
  ): Promise<ChatbotMessageDocument[]> {
    return (await this.chatbotMessageModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()) as ChatbotMessageDocument[];
  }

  /**
   * Build conversation context from history
   */
  private buildConversationContext(history: ChatbotMessageDocument[]): string {
    if (history.length === 0) {
      return '';
    }

    // Reverse to get chronological order (oldest first)
    const chronologicalHistory = [...history].reverse();

    let context = '\n\nPrevious Conversation:';
    for (const msg of chronologicalHistory) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      context += `\n${role}: ${msg.content}`;
    }

    return context;
  }

  /**
   * Generate a contextual prompt for chatbot based on user's pets
   */
  private async buildContextualPrompt(
    userId: string,
    userMessage: string,
    context?: string,
    includeHistory: boolean = true,
  ): Promise<string> {
    try {
      // Get user's pets for context
      const user = await this.userModel.findById(userId).populate('pets');
      if (!user) {
        return this.buildDefaultPrompt(userMessage, context);
      }

      const pets = await this.petModel
        .find({ owner: userId })
        .populate('medicalHistory')
        .limit(5); // Limit to 5 pets for context

      let prompt = `You are a helpful veterinary AI assistant for the Rifq pet care app. You provide friendly, accurate, and practical advice about pet care, health, and wellness.

User's Pets Information:`;

      if (pets.length > 0) {
        for (const pet of pets) {
          prompt += `\n\n- ${pet.name} (${pet.species}${pet.breed ? `, ${pet.breed}` : ''})`;
          if (pet.age) {
            prompt += `, Age: ${pet.age} years`;
          }
          if (pet.weight) {
            prompt += `, Weight: ${pet.weight.toFixed(1)} kg`;
          }

          if (pet.medicalHistory) {
            const history = await this.medicalHistoryModel.findById(
              pet.medicalHistory,
            );
            if (history) {
              if (history.vaccinations && history.vaccinations.length > 0) {
                prompt += `\n  Vaccinations: ${history.vaccinations.join(', ')}`;
              }
              if (
                history.chronicConditions &&
                history.chronicConditions.length > 0
              ) {
                prompt += `\n  Conditions: ${history.chronicConditions.join(', ')}`;
              }
              if (
                history.currentMedications &&
                history.currentMedications.length > 0
              ) {
                const meds = history.currentMedications
                  .map((m) => `${m.name} (${m.dosage})`)
                  .join(', ');
                prompt += `\n  Medications: ${meds}`;
              }
            }
          }
        }
      } else {
        prompt += '\n\nNo pets registered yet.';
      }

      prompt += `\n\nUser Question: ${userMessage}`;

      // Add conversation history if enabled
      if (includeHistory) {
        const history = await this.getConversationHistory(userId, 10);
        if (history.length > 0) {
          prompt += this.buildConversationContext(history);
        }
      }

      if (context) {
        prompt += `\n\nAdditional Context: ${context}`;
      }

      prompt += `\n\nProvide a helpful, accurate, and friendly response. If the question is about a specific pet, reference the pet by name. Always remind users to consult with a veterinarian for serious health concerns.`;

      return prompt;
    } catch (error) {
      this.logger.error('Error building contextual prompt:', error);
      return this.buildDefaultPrompt(userMessage, context);
    }
  }

  /**
   * Build default prompt without user context
   */
  private buildDefaultPrompt(userMessage: string, context?: string): string {
    let prompt = `You are a helpful veterinary AI assistant for the Rifq pet care app. You provide friendly, accurate, and practical advice about pet care, health, and wellness.

User Question: ${userMessage}`;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += `\n\nProvide a helpful, accurate, and friendly response. Always remind users to consult with a veterinarian for serious health concerns.`;

    return prompt;
  }

  /**
   * Process a text message and generate a response (with optional image)
   */
  async processMessage(
    userId: string,
    chatbotMessageDto: ChatbotMessageDto,
  ): Promise<ChatbotResponseDto> {
    try {
      // Get conversation history BEFORE saving the new message
      // This way we don't include the current message in history
      const history = await this.getConversationHistory(userId, 10);

      // Handle image upload if provided
      let imageUrl: string | undefined;
      if (chatbotMessageDto.image) {
        try {
          // Upload image to Cloudinary
          const uploadResult =
            await this.cloudinaryService.uploadImageFromBase64(
              chatbotMessageDto.image as string,
              'chatbot/images',
            );
          imageUrl = uploadResult.secure_url as string;
          this.logger.log(`Image uploaded to Cloudinary: ${imageUrl}`);
        } catch (error) {
          this.logger.error(
            'Failed to upload image to Cloudinary:',
            error instanceof Error ? error.message : String(error),
          );
          // Continue without image URL - we'll still use the base64 for analysis
        }
      }

      // Save user message to database (with image URL if available)
      const userMessage = new this.chatbotMessageModel({
        userId,
        role: 'user',
        content: chatbotMessageDto.message,
        imageUrl,
        imagePrompt: chatbotMessageDto.message, // Store the message as prompt for image
      });
      await userMessage.save();

      let response: string;

      // If image is provided, use vision API
      if (chatbotMessageDto.image) {
        // Build prompt for image analysis with text message
        const imagePrompt = await this.buildImageAnalysisPrompt(
          userId,
          chatbotMessageDto.message,
          history,
          chatbotMessageDto.context,
        );

        this.logger.log(
          `Processing chatbot message with image for user ${userId} (${chatbotMessageDto.message.length} chars)`,
        );

        response = await this.geminiService.analyzeImage(
          chatbotMessageDto.image as string,
          imagePrompt,
          {
            temperature: 0.7,
            maxTokens: 500, // Reduced for shorter responses
          },
        );
      } else {
        // Text-only message
        const prompt = await this.buildContextualPromptWithHistory(
          userId,
          chatbotMessageDto.message,
          history,
          chatbotMessageDto.context,
        );

        this.logger.log(
          `Processing chatbot message for user ${userId} (${chatbotMessageDto.message.length} chars)`,
        );

        response = await this.geminiService.generateText(prompt, {
          temperature: 0.7,
          maxTokens: 500, // Reduced for shorter responses
        });
      }

      // Save assistant response to database
      const assistantMessage = new this.chatbotMessageModel({
        userId,
        role: 'assistant',
        content: response,
      });
      await assistantMessage.save();

      return {
        response,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error processing chatbot message:', error);
      throw error;
    }
  }

  /**
   * Build prompt for image analysis with text message
   */
  private async buildImageAnalysisPrompt(
    userId: string,
    userMessage: string,
    history: ChatbotMessageDocument[],
    context?: string,
  ): Promise<string> {
    try {
      // Get user's pets with full medical history
      const petsWithHistory = await this.getUserPetsWithHistory(userId);

      let prompt = `You are a veterinary AI assistant. Analyze this pet image and answer the user's question: "${userMessage}"

USER'S PETS INFORMATION:`;
      prompt += this.buildPetInformationString(petsWithHistory);

      prompt += `\n\nUSER QUESTION: "${userMessage}"`;

      // Add conversation history
      if (history.length > 0) {
        prompt += this.buildConversationContext(history);
        prompt += '\n\n';
      }

      // Add additional context
      if (context) {
        prompt += `Additional Context: ${context}\n\n`;
      }

      prompt += `IMPORTANT: Provide a CONCISE response (3-5 sentences maximum) that:
- Directly answers: "${userMessage}"
- Briefly describes what you see in the image
- References specific pet by name if you can identify which pet it is
- Gives 1-2 key recommendations based on the pet's medical history if relevant
- Reminds to consult a vet for serious concerns`;

      return prompt;
    } catch (error) {
      this.logger.error('Error building image analysis prompt:', error);
      // Fallback prompt
      return `Analyze this pet image and answer: "${userMessage}". Provide health insights and recommendations.`;
    }
  }

  /**
   * Build contextual prompt with explicit history
   */
  private async buildContextualPromptWithHistory(
    userId: string,
    userMessage: string,
    history: ChatbotMessageDocument[],
    context?: string,
  ): Promise<string> {
    try {
      // Get user's pets with full medical history
      const petsWithHistory = await this.getUserPetsWithHistory(userId);

      let prompt = `You are a helpful veterinary AI assistant for the Rifq pet care app. You provide friendly, accurate, and practical advice about pet care, health, and wellness.

USER'S PETS INFORMATION:`;
      prompt += this.buildPetInformationString(petsWithHistory);

      prompt += `\n\nUSER QUESTION: ${userMessage}`;

      // Add conversation history if available
      if (history.length > 0) {
        prompt += this.buildConversationContext(history);
      }

      if (context) {
        prompt += `\n\nAdditional Context: ${context}`;
      }

      prompt += `\n\nIMPORTANT: Provide a CONCISE and helpful response (2-4 sentences maximum). Be direct and to the point. If the question is about a specific pet, reference the pet by name and consider their medical history (vaccinations, conditions, medications) when providing advice. Always remind users to consult with a veterinarian for serious health concerns.`;

      return prompt;
    } catch (error) {
      this.logger.error('Error building contextual prompt:', error);
      return this.buildDefaultPromptWithHistory(userMessage, history, context);
    }
  }

  /**
   * Build default prompt with history
   */
  private buildDefaultPromptWithHistory(
    userMessage: string,
    history: ChatbotMessageDocument[],
    context?: string,
  ): string {
    let prompt = `You are a helpful veterinary AI assistant for the Rifq pet care app. You provide friendly, accurate, and practical advice about pet care, health, and wellness.

User Question: ${userMessage}`;

    // Add conversation history if available
    if (history.length > 0) {
      prompt += this.buildConversationContext(history);
    }

    if (context) {
      prompt += `\n\nAdditional Context: ${context}`;
    }

    prompt += `\n\nIMPORTANT: Provide a CONCISE and helpful response (2-4 sentences maximum). Be direct and to the point. Always remind users to consult with a veterinarian for serious health concerns.`;

    return prompt;
  }

  /**
   * Analyze an image and provide insights
   */
  async analyzeImage(
    userId: string,
    imageAnalysisDto: ChatbotImageAnalysisDto,
  ): Promise<ChatbotResponseDto> {
    try {
      // Get user's pets with full medical history
      const petsWithHistory = await this.getUserPetsWithHistory(userId);

      // Build image analysis prompt
      let prompt = `You are a veterinary AI assistant. Analyze this pet image and provide health insights, observations, and recommendations.

USER'S PETS INFORMATION:`;
      prompt += this.buildPetInformationString(petsWithHistory);

      if (imageAnalysisDto.prompt) {
        prompt += `\n\nUSER QUESTION: ${imageAnalysisDto.prompt}`;
      } else {
        prompt += `\n\nAnalyze this pet image and provide health insights, observations, and any recommendations.`;
      }

      prompt += `\n\nIMPORTANT: Provide a CONCISE analysis (3-5 sentences maximum):
- Briefly describe what you observe in the image
- Reference specific pet by name if you can identify which pet it is
- Mention 1-2 key health concerns or positive indicators
- Consider the pet's medical history (vaccinations, conditions, medications) when relevant
- Give 1-2 actionable recommendations
- Remind to consult a veterinarian for serious concerns`;

      this.logger.log(
        `Analyzing image for user ${userId} (${imageAnalysisDto.image.length} chars base64)`,
      );

      const response = await this.geminiService.analyzeImage(
        imageAnalysisDto.image,
        prompt,
        {
          temperature: 0.7,
          maxTokens: 500, // Reduced for shorter responses
        },
      );

      // Save image analysis to database
      // Note: We save the analysis as a user message with image context
      const userMessage = new this.chatbotMessageModel({
        userId,
        role: 'user',
        content: imageAnalysisDto.prompt || 'Image analysis requested',
        imagePrompt: imageAnalysisDto.prompt,
      });
      await userMessage.save();

      const assistantMessage = new this.chatbotMessageModel({
        userId,
        role: 'assistant',
        content: response,
      });
      await assistantMessage.save();

      return {
        response,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a user
   */
  async getHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatbotHistoryResponseDto> {
    const messages = await this.chatbotMessageModel
      .find({ userId })
      .sort({ createdAt: 1 }) // Oldest first for conversation flow
      .skip(offset)
      .limit(limit)
      .exec();

    const total = await this.chatbotMessageModel.countDocuments({ userId });

    // Map documents to DTOs
    const messageDtos: ChatbotMessageItemDto[] = (
      messages as ChatbotMessageDocument[]
    ).map((msg) => ({
      _id: String(msg._id),
      role: msg.role,
      content: msg.content,
      imageUrl: msg.imageUrl,
      imagePrompt: msg.imagePrompt,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    return {
      messages: messageDtos,
      total,
    };
  }

  /**
   * Clear conversation history for a user
   */
  async clearHistory(userId: string): Promise<{ message: string }> {
    await this.chatbotMessageModel.deleteMany({ userId });
    return { message: 'Conversation history cleared successfully' };
  }
}
