// src/modules/chatbot/chatbot.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { ChatbotGeminiService } from './chatbot-gemini.service';
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
    private readonly chatbotGeminiService: ChatbotGeminiService,
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

      let prompt = `You are a Vet AI assistant for the Rifq pet care app. You provide veterinary advice including diagnoses, recommendations, tips, and descriptions about pet health and care. You can analyze symptoms, suggest possible conditions, and provide guidance based on the pet's profile. However, always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation and treatment.

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

      prompt += `\n\nIMPORTANT: Provide veterinary advice including possible diagnoses, recommendations, tips, and descriptions. If the question is about a specific pet, reference the pet by name. You can suggest possible conditions based on symptoms, but always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation, proper diagnosis, and treatment.`;

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
    let prompt = `You are a Vet AI assistant for the Rifq pet care app. You provide veterinary advice including diagnoses, recommendations, tips, and descriptions about pet health and care. You can analyze symptoms, suggest possible conditions, and provide guidance.

User Question: ${userMessage}`;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += `\n\nProvide veterinary advice including possible diagnoses, recommendations, tips, and descriptions. Always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation and proper treatment.`;

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
        // Get user's pets with photos for comparison
        const petsWithHistory = await this.getUserPetsWithHistory(userId);
        const petPhotos = await this.getPetPhotosForComparison(petsWithHistory);

        // Build prompt for image analysis with text message and pet photos info
        const imagePrompt = await this.buildImageAnalysisPrompt(
          userId,
          chatbotMessageDto.message,
          history,
          chatbotMessageDto.context,
          petPhotos,
        );

        this.logger.log(
          `Processing chatbot message with image for user ${userId} (${chatbotMessageDto.message.length} chars, ${petPhotos.length} pet photos for comparison)`,
        );

        // Analyze image with pet photos for comparison
        response = await this.chatbotGeminiService.analyzeImageWithPetPhotos(
          chatbotMessageDto.image as string,
          imagePrompt,
          petPhotos,
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

        response = await this.chatbotGeminiService.generateText(prompt, {
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
   * Download image from URL and convert to base64
   */
  private async downloadImageAsBase64(imageUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      const buffer = Buffer.from(response.data);
      const base64 = buffer.toString('base64');
      const contentType = response.headers['content-type'] || 'image/jpeg';
      
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      this.logger.warn(`Failed to download pet photo from ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Get pet photos as base64 for comparison
   */
  private async getPetPhotosForComparison(
    petsWithHistory: Array<{
      pet: PetDocument;
      medicalHistory: MedicalHistoryDocument | null;
    }>,
  ): Promise<Array<{ petName: string; photoBase64: string }>> {
    const petPhotos: Array<{ petName: string; photoBase64: string }> = [];

    for (const { pet } of petsWithHistory) {
      if (pet.photo) {
        const photoBase64 = await this.downloadImageAsBase64(pet.photo);
        if (photoBase64) {
          petPhotos.push({
            petName: pet.name,
            photoBase64,
          });
          this.logger.log(`Downloaded photo for pet: ${pet.name}`);
        }
      }
    }

    return petPhotos;
  }

  /**
   * Build prompt for image analysis with text message
   */
  private async buildImageAnalysisPrompt(
    userId: string,
    userMessage: string,
    history: ChatbotMessageDocument[],
    context?: string,
    petPhotos?: Array<{ petName: string; photoBase64: string }>,
  ): Promise<string> {
    try {
      // Get user's pets with full medical history
      const petsWithHistory = await this.getUserPetsWithHistory(userId);

      let prompt = `You are a Vet AI assistant for the Rifq pet care app. You will receive:
1. A user-uploaded image of a pet
${petPhotos && petPhotos.length > 0 ? `2. ${petPhotos.length} reference photo(s) of the user's registered pets (for comparison and identification)` : ''}

Your task:
- FIRST: Compare the user's uploaded image with the reference pet photos to identify which pet it is (if it matches one of the registered pets)
- THEN: Analyze the image and provide veterinary insights including possible diagnoses, recommendations, tips, and descriptions
- You can identify potential health issues, suggest conditions, and provide guidance based on what you observe

USER'S PETS INFORMATION:`;
      prompt += this.buildPetInformationString(petsWithHistory);

      if (petPhotos && petPhotos.length > 0) {
        prompt += `\n\nREFERENCE PET PHOTOS FOR COMPARISON:`;
        petPhotos.forEach(({ petName }) => {
          prompt += `\n- ${petName} (reference photo provided below)`;
        });
        prompt += `\n\nCompare the user's uploaded image with these reference photos to identify which pet it is.`;
      }

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
- FIRST identifies which pet this is by comparing with reference photos (if available): "This appears to be [Pet Name] based on the comparison with their profile photo"
- Directly answers: "${userMessage}"
- Describes what you observe in the image and suggests possible diagnoses or conditions
- Provides 1-2 recommendations or tips based on the identified pet's medical history if relevant
- Reminds users that this is AI assistance and they should consult a licensed veterinarian for confirmation and treatment`;

      return prompt;
    } catch (error) {
      this.logger.error('Error building image analysis prompt:', error);
      // Fallback prompt
      return `You are a Vet AI assistant. Analyze this pet image and provide veterinary insights including possible diagnoses, observations, recommendations, and tips. Answer: "${userMessage}". Remind users that this is AI assistance and they should consult a licensed veterinarian for confirmation and treatment.`;
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

      let prompt = `You are a Vet AI assistant for the Rifq pet care app. You provide veterinary advice including diagnoses, recommendations, tips, and descriptions about pet health and care. You can analyze symptoms, suggest possible conditions, and provide guidance based on the pet's profile. However, always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation and treatment.

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

      prompt += `\n\nIMPORTANT: Provide a CONCISE response (2-4 sentences maximum) with veterinary advice including possible diagnoses, recommendations, tips, and descriptions. Be direct and to the point. If the question is about a specific pet, reference the pet by name and consider their medical history (vaccinations, conditions, medications) when providing advice. You can suggest possible conditions based on symptoms, but always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation and proper treatment.`;

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
    let prompt = `You are a Vet AI assistant for the Rifq pet care app. You provide veterinary advice including diagnoses, recommendations, tips, and descriptions about pet health and care. You can analyze symptoms, suggest possible conditions, and provide guidance.

User Question: ${userMessage}`;

    // Add conversation history if available
    if (history.length > 0) {
      prompt += this.buildConversationContext(history);
    }

    if (context) {
      prompt += `\n\nAdditional Context: ${context}`;
    }

    prompt += `\n\nIMPORTANT: Provide a CONCISE response (2-4 sentences maximum) with veterinary advice including possible diagnoses, recommendations, tips, and descriptions. Be direct and to the point. You can suggest possible conditions based on symptoms, but always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation and proper treatment.`;

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
      
      // Get pet photos for comparison
      const petPhotos = await this.getPetPhotosForComparison(petsWithHistory);

      // Build image analysis prompt
      let prompt = `You are a Vet AI assistant for the Rifq pet care app. You will receive:
1. A user-uploaded image of a pet
${petPhotos && petPhotos.length > 0 ? `2. ${petPhotos.length} reference photo(s) of the user's registered pets (for comparison and identification)` : ''}

Your task:
- FIRST: Compare the user's uploaded image with the reference pet photos to identify which pet it is (if it matches one of the registered pets)
- THEN: Analyze the image and provide veterinary insights including possible diagnoses, observations, recommendations, and tips

USER'S PETS INFORMATION:`;
      prompt += this.buildPetInformationString(petsWithHistory);

      if (petPhotos && petPhotos.length > 0) {
        prompt += `\n\nREFERENCE PET PHOTOS FOR COMPARISON:`;
        petPhotos.forEach(({ petName }) => {
          prompt += `\n- ${petName} (reference photo provided below)`;
        });
        prompt += `\n\nCompare the user's uploaded image with these reference photos to identify which pet it is.`;
      }

      if (imageAnalysisDto.prompt) {
        prompt += `\n\nUSER QUESTION: ${imageAnalysisDto.prompt}`;
      } else {
        prompt += `\n\nAnalyze this pet image and provide health insights, observations, and any recommendations.`;
      }

      prompt += `\n\nIMPORTANT: Provide a CONCISE analysis (3-5 sentences maximum) with veterinary insights:
- FIRST identifies which pet this is by comparing with reference photos (if available): "This appears to be [Pet Name] based on the comparison with their profile photo"
- Describe what you observe in the image and suggest possible diagnoses or conditions
- Mention 1-2 health observations or potential issues you identify
- Consider the identified pet's medical history (vaccinations, conditions, medications) when providing advice
- Give 1-2 recommendations or tips
- Remind users that this is AI assistance and they should consult a licensed veterinarian for confirmation and treatment`;

      this.logger.log(
        `Analyzing image for user ${userId} (${imageAnalysisDto.image.length} chars base64, ${petPhotos.length} pet photos for comparison)`,
      );

      // Analyze image with pet photos for comparison
      const response = await this.chatbotGeminiService.analyzeImageWithPetPhotos(
        imageAnalysisDto.image,
        prompt,
        petPhotos,
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
