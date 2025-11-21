// src/modules/ai/ai.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pet, PetDocument } from '../pets/schemas/pet.schema';
import {
  MedicalHistory,
  MedicalHistoryDocument,
} from '../pets/schemas/medical-history.schema';
import { GeminiService } from './gemini.service';
import {
  AiTipsResponseDto,
  TipItemDto,
} from './dto/ai-tips-response.dto';
import {
  AiRecommendationsResponseDto,
  RecommendationItemDto,
} from './dto/ai-recommendations-response.dto';
import {
  AiRemindersResponseDto,
  ReminderItemDto,
} from './dto/ai-reminders-response.dto';
import {
  AiStatusResponseDto,
  StatusPillDto,
} from './dto/ai-status-response.dto';

interface CachedResponse<T> {
  data: T;
  timestamp: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  
  // Cache for AI responses (24 hours TTL to reduce API calls and stay within daily quota)
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private tipsCache = new Map<string, CachedResponse<AiTipsResponseDto>>();
  private recommendationsCache = new Map<string, CachedResponse<AiRecommendationsResponseDto>>();
  private remindersCache = new Map<string, CachedResponse<AiRemindersResponseDto>>();
  private statusCache = new Map<string, CachedResponse<AiStatusResponseDto>>();

  constructor(
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
    @InjectModel(MedicalHistory.name)
    private medicalHistoryModel: Model<MedicalHistoryDocument>,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Get pet with medical history
   */
  private async getPetWithHistory(petId: string): Promise<{
    pet: PetDocument;
    medicalHistory: MedicalHistoryDocument | null;
  }> {
    const pet = await this.petModel.findById(petId).populate('medicalHistory');
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    let medicalHistory: MedicalHistoryDocument | null = null;
    if (pet.medicalHistory) {
      medicalHistory = await this.medicalHistoryModel.findById(
        pet.medicalHistory,
      );
    }

    return { pet, medicalHistory };
  }

  /**
   * Build prompt for tips
   */
  private buildTipsPrompt(
    pet: PetDocument,
    medicalHistory: MedicalHistoryDocument | null,
  ): string {
    let prompt = `You are a veterinary assistant AI. Provide ONE concise, actionable daily care tip for ${pet.name}:

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || 'Unknown'}
- Age: ${pet.age ? `${pet.age} years` : 'Unknown'}
- Gender: ${pet.gender || 'Unknown'}`;

    if (pet.weight) {
      prompt += `\n- Weight: ${pet.weight.toFixed(1)} kg`;
    }

    if (medicalHistory) {
      prompt += '\n\nMedical History:';

      if (
        medicalHistory.vaccinations &&
        medicalHistory.vaccinations.length > 0
      ) {
        prompt += `\n- Vaccinations: ${medicalHistory.vaccinations.join(', ')}`;
      }

      if (
        medicalHistory.chronicConditions &&
        medicalHistory.chronicConditions.length > 0
      ) {
        prompt += `\n- Chronic Conditions: ${medicalHistory.chronicConditions.join(', ')}`;
      }

      if (
        medicalHistory.currentMedications &&
        medicalHistory.currentMedications.length > 0
      ) {
        const medList = medicalHistory.currentMedications
          .map((med) => `${med.name} (${med.dosage})`)
          .join(', ');
        prompt += `\n- Current Medications: ${medList}`;
      }
    }

    prompt += `\n\nProvide ONE practical, actionable tip (1-2 sentences max) based on ${pet.name}'s current needs and health status. Make it specific and helpful. Do not include the pet's name in the tip text itself.`;

    return prompt;
  }

  /**
   * Build prompt for recommendations
   */
  private buildRecommendationsPrompt(
    pet: PetDocument,
    medicalHistory: MedicalHistoryDocument | null,
  ): string {
    let prompt = `You are a veterinary assistant AI. Provide personalized recommendations for ${pet.name}:

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || 'Unknown'}
- Age: ${pet.age ? `${pet.age} years` : 'Unknown'}`;

    if (medicalHistory) {
      prompt += '\n\nMedical History:';

      if (
        medicalHistory.vaccinations &&
        medicalHistory.vaccinations.length > 0
      ) {
        prompt += `\n- Vaccinations: ${medicalHistory.vaccinations.join(', ')}`;
      } else {
        prompt += '\n- Vaccinations: None recorded (may need core vaccines)';
      }

      if (
        medicalHistory.chronicConditions &&
        medicalHistory.chronicConditions.length > 0
      ) {
        prompt += `\n- Chronic Conditions: ${medicalHistory.chronicConditions.join(', ')}`;
      }

      if (
        medicalHistory.currentMedications &&
        medicalHistory.currentMedications.length > 0
      ) {
        const medList = medicalHistory.currentMedications
          .map((med) => `${med.name} (${med.dosage})`)
          .join(', ');
        prompt += `\n- Current Medications: ${medList}`;
      }
    }

    prompt += `\n\nProvide recommendations for:
1. Next vaccination schedule (if applicable)
2. Medication reminders and timing
3. Health check-ups
4. Preventive care measures

Format as a numbered list. Be specific and actionable. If vaccinations are missing, recommend core vaccines.`;

    return prompt;
  }

  /**
   * Build prompt for reminders
   */
  private buildRemindersPrompt(
    pet: PetDocument,
    medicalHistory: MedicalHistoryDocument | null,
  ): string {
    let prompt = `Generate personalized reminders for ${pet.name}:

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Age: ${pet.age ? `${pet.age} years` : 'Unknown'}`;

    if (medicalHistory) {
      if (
        medicalHistory.currentMedications &&
        medicalHistory.currentMedications.length > 0
      ) {
        prompt += '\n\nCurrent Medications:';
        for (const med of medicalHistory.currentMedications) {
          prompt += `\n- ${med.name}: ${med.dosage}`;
        }
      }

      if (
        medicalHistory.vaccinations &&
        medicalHistory.vaccinations.length > 0
      ) {
        prompt += `\n\nVaccinations: ${medicalHistory.vaccinations.join(', ')}`;
      } else {
        prompt += '\n\nVaccinations: None recorded';
      }
    }

    prompt += `\n\nGenerate 2-3 specific, actionable reminders for ${pet.name}. Include:
- Medication schedules (if applicable)
- Vaccination needs
- Health check recommendations

Format as a numbered list. Be specific with dates/times when available.`;

    return prompt;
  }

  /**
   * Build prompt for status
   */
  private buildStatusPrompt(
    pet: PetDocument,
    medicalHistory: MedicalHistoryDocument | null,
  ): string {
    let prompt = `Analyze the health status of ${pet.name} and provide a brief status:

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || 'Unknown'}
- Age: ${pet.age ? `${pet.age} years` : 'Unknown'}`;

    if (medicalHistory) {
      if (
        medicalHistory.vaccinations &&
        medicalHistory.vaccinations.length > 0
      ) {
        prompt += `\n- Vaccinations: ${medicalHistory.vaccinations.join(', ')}`;
      } else {
        prompt += '\n- Vaccinations: None recorded (may need core vaccines)';
      }

      if (
        medicalHistory.chronicConditions &&
        medicalHistory.chronicConditions.length > 0
      ) {
        prompt += `\n- Chronic Conditions: ${medicalHistory.chronicConditions.join(', ')}`;
      }

      if (
        medicalHistory.currentMedications &&
        medicalHistory.currentMedications.length > 0
      ) {
        const medList = medicalHistory.currentMedications
          .map((med) => `${med.name} (${med.dosage})`)
          .join(', ');
        prompt += `\n- Current Medications: ${medList}`;
      }
    }

    prompt += `\n\nProvide a brief health status (one word or short phrase): "Healthy", "Needs Attention", "Due for Checkup", "On Medication", etc. Only return the status word/phrase, nothing else.`;

    return prompt;
  }

  /**
   * Parse tips response
   */
  private parseTipsResponse(response: string, pet: PetDocument): TipItemDto {
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Extract first meaningful tip
    let tipText = lines[0] || response.trim();

    // Remove numbering if present
    tipText = tipText.replace(/^[\d]+[\.\)]\s+/, '').trim();

    // Get emoji based on species
    const emoji = this.getEmojiForPet(pet.species);

    return {
      emoji,
      title: `Tips about ${pet.name}`,
      detail: tipText,
    };
  }

  /**
   * Parse recommendations response
   */
  private parseRecommendationsResponse(
    response: string,
  ): RecommendationItemDto[] {
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const recommendations: RecommendationItemDto[] = [];
    let recommendationIndex = 0;

    for (const line of lines) {
      if (
        line.match(/^[\d]+[\.\)]\s+/) ||
        line.startsWith('- ') ||
        line.startsWith('• ')
      ) {
        const cleaned = line
          .replace(/^[\d]+[\.\)]\s+/, '')
          .replace(/^[-•]\s+/, '')
          .trim();

        if (cleaned.length > 0 && recommendationIndex < 5) {
          const type = this.getRecommendationType(cleaned);
          const title = this.getRecommendationTitle(cleaned, type);

          recommendations.push({
            title,
            detail: cleaned,
            type,
          });

          recommendationIndex++;
        }
      }
    }

    return recommendations.length > 0
      ? recommendations
      : [
          {
            title: 'General Care',
            detail: response.trim(),
            type: 'general',
          },
        ];
  }

  /**
   * Parse reminders response
   */
  private parseRemindersResponse(
    response: string,
    pet: PetDocument,
  ): ReminderItemDto[] {
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const reminders: ReminderItemDto[] = [];
    let reminderIndex = 0;

    for (const line of lines) {
      if (
        line.match(/^[\d]+[\.\)]\s+/) ||
        line.startsWith('- ') ||
        line.startsWith('• ')
      ) {
        const cleaned = line
          .replace(/^[\d]+[\.\)]\s+/, '')
          .replace(/^[-•]\s+/, '')
          .trim();

        if (cleaned.length > 0 && reminderIndex < 3) {
          const date = this.extractDateFromText(cleaned);
          const icon = this.getIconForReminder(cleaned);
          const title = `${pet.name} • ${this.getReminderTitle(cleaned)}`;
          const tint = this.getTintForReminder(cleaned);

          reminders.push({
            icon,
            title,
            detail: cleaned,
            date: date.toISOString(),
            tint,
          });

          reminderIndex++;
        }
      }
    }

    return reminders;
  }

  /**
   * Parse status response
   */
  private parseStatusResponse(
    response: string,
    pet: PetDocument,
    medicalHistory: MedicalHistoryDocument | null,
  ): AiStatusResponseDto {
    const status = response.trim().split(/\s+/).slice(0, 3).join(' ');

    const pills: StatusPillDto[] = [];

    // Health status pill
    if (status.toLowerCase().includes('healthy')) {
      pills.push({
        text: 'Healthy',
        bg: '#10B981',
        fg: '#065F46',
      });
    } else if (
      status.toLowerCase().includes('attention') ||
      status.toLowerCase().includes('checkup')
    ) {
      pills.push({
        text: 'Needs Attention',
        bg: '#F97316',
        fg: '#9A3412',
      });
    } else {
      pills.push({
        text: status,
        bg: '#EF4444',
        fg: '#991B1B',
      });
    }

    // Build summary
    const summaryParts: string[] = [];

    if (
      medicalHistory?.vaccinations &&
      medicalHistory.vaccinations.length > 0
    ) {
      summaryParts.push('✓ Up-to-date');
    } else {
      summaryParts.push('⚠ Needs vaccines');
    }

    const medCount =
      medicalHistory?.currentMedications?.length || 0;
    if (medCount > 0) {
      summaryParts.push(`${medCount} med`);
    }

    if (pet.weight) {
      summaryParts.push(`${pet.weight.toFixed(1)} kg`);
    }

    return {
      status,
      pills,
      summary: summaryParts.join(' | ') || 'All good',
    };
  }

  /**
   * Get cached response or null if expired
   */
  private getCached<T>(
    cache: Map<string, CachedResponse<T>>,
    key: string,
  ): T | null {
    const cached = cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTTL) {
      cache.delete(key);
      return null;
    }

    this.logger.log(`📦 Returning cached response for ${key} (age: ${Math.floor(age / 1000)}s)`);
    return cached.data;
  }

  /**
   * Set cached response
   */
  private setCached<T>(
    cache: Map<string, CachedResponse<T>>,
    key: string,
    data: T,
  ): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Generate tips for a pet
   */
  async generateTips(petId: string): Promise<AiTipsResponseDto> {
    // Check cache first
    const cached = this.getCached(this.tipsCache, petId);
    if (cached) {
      return cached;
    }

    // Check for stale cache (even if expired) - return immediately if rate limited
    const staleCache = this.tipsCache.get(petId);
    if (staleCache) {
      // Return stale cache immediately and refresh in background
      this.logger.log(`📦 Returning stale cached tips for ${petId} (will refresh in background)`);
      this.refreshCacheInBackground(petId, () => this.fetchAndCacheTips(petId));
      return staleCache.data;
    }

    // No cache at all, fetch fresh data
    return this.fetchAndCacheTips(petId);
  }

  private async fetchAndCacheTips(petId: string): Promise<AiTipsResponseDto> {
    const { pet, medicalHistory } = await this.getPetWithHistory(petId);
    const prompt = this.buildTipsPrompt(pet, medicalHistory);

    try {
      const response = await this.geminiService.generateText(prompt, {
        temperature: 0.8,
        maxTokens: 2000, // Increased to handle "thoughts" tokens in gemini-2.5-pro
      });

      const tip = this.parseTipsResponse(response, pet);
      const result = { tips: [tip] };
      
      // Cache the result
      this.setCached(this.tipsCache, petId, result);
      
      return result;
    } catch (error) {
      this.logger.error(`Error generating tips for pet ${petId}:`, error);
      
      // Return cached data if available (even if expired) as fallback
      const staleCache = this.tipsCache.get(petId);
      if (staleCache) {
        this.logger.warn(`⚠️ Returning stale cached tips for ${petId} due to error`);
        return staleCache.data;
      }
      
      // Check if it's an API key error
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        throw new Error('AI service is not configured. Please contact support.');
      }
      
      // Check if it's a daily quota error - don't retry, return error
      if (error instanceof Error && error.message.includes('AI_DAILY_QUOTA_EXCEEDED')) {
        this.logger.error(`❌ Daily quota exceeded for ${petId}`);
        // Return stale cache if available, otherwise throw
        const stale = this.tipsCache.get(petId);
        if (stale) {
          this.logger.warn(`⚠️ Returning stale cache due to daily quota exhaustion`);
          return stale.data;
        }
        // Re-throw with clear message
        throw new Error('AI_DAILY_QUOTA_EXCEEDED: Daily quota exceeded. Please try again tomorrow.');
      }
      
      // Check if it's a rate limit error (per-minute) - can retry later
      if (error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('429'))) {
        this.logger.warn(`⚠️ Rate limit hit for ${petId}, returning stale cache if available`);
        const stale = this.tipsCache.get(petId);
        if (stale) {
          return stale.data;
        }
      }
      
      throw error;
    }
  }

  private refreshCacheInBackground(petId: string, fetchFn: () => Promise<any>): void {
    // Don't await - run in background
    fetchFn().catch((error) => {
      this.logger.warn(`Background refresh failed for ${petId}:`, error);
    });
  }

  /**
   * Generate recommendations for a pet
   */
  async generateRecommendations(
    petId: string,
  ): Promise<AiRecommendationsResponseDto> {
    // Check cache first
    const cached = this.getCached(this.recommendationsCache, petId);
    if (cached) {
      return cached;
    }

    const { pet, medicalHistory } = await this.getPetWithHistory(petId);
    const prompt = this.buildRecommendationsPrompt(pet, medicalHistory);

    try {
      const response = await this.geminiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 2000, // Increased to handle "thoughts" tokens in gemini-2.5-pro
      });

      const recommendations = this.parseRecommendationsResponse(response);
      const result = { recommendations };
      
      // Cache the result
      this.setCached(this.recommendationsCache, petId, result);
      
      return result;
    } catch (error) {
      this.logger.error(
        `Error generating recommendations for pet ${petId}:`,
        error,
      );
      
      // Return cached data if available (even if expired) as fallback
      const staleCache = this.recommendationsCache.get(petId);
      if (staleCache) {
        this.logger.warn(`⚠️ Returning stale cached recommendations for ${petId} due to error`);
        return staleCache.data;
      }
      
      // Check if it's an API key error
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        throw new Error('AI service is not configured. Please contact support.');
      }
      
      // Check if it's a daily quota error
      if (error instanceof Error && error.message.includes('AI_DAILY_QUOTA_EXCEEDED')) {
        const stale = this.recommendationsCache.get(petId);
        if (stale) {
          this.logger.warn(`⚠️ Returning stale cache due to daily quota exhaustion`);
          return stale.data;
        }
        throw new Error('AI_DAILY_QUOTA_EXCEEDED: Daily quota exceeded. Please try again tomorrow.');
      }
      
      // Check if it's a rate limit error
      if (error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('429'))) {
        const stale = this.recommendationsCache.get(petId);
        if (stale) {
          return stale.data;
        }
      }
      
      throw error;
    }
  }

  /**
   * Generate reminders for a pet
   */
  async generateReminders(petId: string): Promise<AiRemindersResponseDto> {
    // Check cache first
    const cached = this.getCached(this.remindersCache, petId);
    if (cached) {
      return cached;
    }

    const { pet, medicalHistory } = await this.getPetWithHistory(petId);
    const prompt = this.buildRemindersPrompt(pet, medicalHistory);

    try {
      const response = await this.geminiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 2000, // Increased to handle "thoughts" tokens in gemini-2.5-pro
      });

      const reminders = this.parseRemindersResponse(response, pet);
      const result = { reminders };
      
      // Cache the result
      this.setCached(this.remindersCache, petId, result);
      
      return result;
    } catch (error) {
      this.logger.error(
        `Error generating reminders for pet ${petId}:`,
        error,
      );
      
      // Return cached data if available (even if expired) as fallback
      const staleCache = this.remindersCache.get(petId);
      if (staleCache) {
        this.logger.warn(`⚠️ Returning stale cached reminders for ${petId} due to error`);
        return staleCache.data;
      }
      
      // Check if it's an API key error
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        throw new Error('AI service is not configured. Please contact support.');
      }
      
      // Check if it's a daily quota error
      if (error instanceof Error && error.message.includes('AI_DAILY_QUOTA_EXCEEDED')) {
        const stale = this.remindersCache.get(petId);
        if (stale) {
          this.logger.warn(`⚠️ Returning stale cache due to daily quota exhaustion`);
          return stale.data;
        }
        throw new Error('AI_DAILY_QUOTA_EXCEEDED: Daily quota exceeded. Please try again tomorrow.');
      }
      
      // Check if it's a rate limit error
      if (error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('429'))) {
        const stale = this.remindersCache.get(petId);
        if (stale) {
          return stale.data;
        }
      }
      
      throw error;
    }
  }

  /**
   * Generate status for a pet
   */
  async generateStatus(petId: string): Promise<AiStatusResponseDto> {
    // Check cache first
    const cached = this.getCached(this.statusCache, petId);
    if (cached) {
      return cached;
    }

    const { pet, medicalHistory } = await this.getPetWithHistory(petId);
    const prompt = this.buildStatusPrompt(pet, medicalHistory);

    try {
      const response = await this.geminiService.generateText(prompt, {
        temperature: 0.6,
        maxTokens: 1000, // Increased to handle "thoughts" tokens in gemini-2.5-pro
      });

      const result = this.parseStatusResponse(response, pet, medicalHistory);
      
      // Cache the result
      this.setCached(this.statusCache, petId, result);
      
      return result;
    } catch (error) {
      this.logger.error(`Error generating status for pet ${petId}:`, error);
      
      // Return cached data if available (even if expired) as fallback
      const staleCache = this.statusCache.get(petId);
      if (staleCache) {
        this.logger.warn(`⚠️ Returning stale cached status for ${petId} due to error`);
        return staleCache.data;
      }
      
      // Check if it's an API key error
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        throw new Error('AI service is not configured. Please contact support.');
      }
      
      // Check if it's a daily quota error
      if (error instanceof Error && error.message.includes('AI_DAILY_QUOTA_EXCEEDED')) {
        const stale = this.statusCache.get(petId);
        if (stale) {
          this.logger.warn(`⚠️ Returning stale cache due to daily quota exhaustion`);
          return stale.data;
        }
        throw new Error('AI_DAILY_QUOTA_EXCEEDED: Daily quota exceeded. Please try again tomorrow.');
      }
      
      // Check if it's a rate limit error
      if (error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('429'))) {
        const stale = this.statusCache.get(petId);
        if (stale) {
          return stale.data;
        }
      }
      
      throw error;
    }
  }

  // Helper methods
  private getEmojiForPet(species: string): string {
    const lower = species.toLowerCase();
    if (lower.includes('dog')) return '🐕';
    if (lower.includes('cat')) return '🐈';
    if (lower.includes('bird')) return '🐦';
    return '🐾';
  }

  private getRecommendationType(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('vaccin')) return 'vaccination';
    if (lower.includes('medic') || lower.includes('pill')) return 'medication';
    if (lower.includes('check') || lower.includes('appointment'))
      return 'checkup';
    return 'general';
  }

  private getRecommendationTitle(text: string, type: string): string {
    if (type === 'vaccination') return 'Vaccination Schedule';
    if (type === 'medication') return 'Medication Reminder';
    if (type === 'checkup') return 'Health Check-up';
    return 'General Recommendation';
  }

  private extractDateFromText(text: string): Date {
    const now = new Date();
    const lower = text.toLowerCase();

    if (lower.includes('today')) {
      return now;
    } else if (lower.includes('tomorrow')) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (lower.includes('week')) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (lower.includes('month')) {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Default to 3 days from now
    return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  }

  private getIconForReminder(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('vaccin')) return 'syringe.fill';
    if (lower.includes('medic') || lower.includes('pill')) return 'pills.fill';
    if (lower.includes('appointment') || lower.includes('check'))
      return 'calendar.badge.clock';
    if (lower.includes('groom')) return 'scissors';
    return 'bell.fill';
  }

  private getReminderTitle(text: string): string {
    const words = text.split(/\s+/);
    if (words.length > 5) {
      return words.slice(0, 4).join(' ');
    }
    return text;
  }

  private getTintForReminder(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('vaccin')) return '#10B981'; // green
    if (lower.includes('medic') || lower.includes('pill'))
      return '#3B82F6'; // blue
    if (lower.includes('appointment')) return '#EF4444'; // red
    return '#8B5CF6'; // purple
  }
}

