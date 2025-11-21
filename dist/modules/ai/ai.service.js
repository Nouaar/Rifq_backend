"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const pet_schema_1 = require("../pets/schemas/pet.schema");
const medical_history_schema_1 = require("../pets/schemas/medical-history.schema");
const gemini_service_1 = require("./gemini.service");
let AiService = AiService_1 = class AiService {
    constructor(petModel, medicalHistoryModel, geminiService) {
        this.petModel = petModel;
        this.medicalHistoryModel = medicalHistoryModel;
        this.geminiService = geminiService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.cacheTTL = 24 * 60 * 60 * 1000;
        this.tipsCache = new Map();
        this.recommendationsCache = new Map();
        this.remindersCache = new Map();
        this.statusCache = new Map();
    }
    async getPetWithHistory(petId) {
        const pet = await this.petModel.findById(petId).populate('medicalHistory');
        if (!pet) {
            throw new common_1.NotFoundException('Pet not found');
        }
        let medicalHistory = null;
        if (pet.medicalHistory) {
            medicalHistory = await this.medicalHistoryModel.findById(pet.medicalHistory);
        }
        return { pet, medicalHistory };
    }
    buildTipsPrompt(pet, medicalHistory) {
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
            if (medicalHistory.vaccinations &&
                medicalHistory.vaccinations.length > 0) {
                prompt += `\n- Vaccinations: ${medicalHistory.vaccinations.join(', ')}`;
            }
            if (medicalHistory.chronicConditions &&
                medicalHistory.chronicConditions.length > 0) {
                prompt += `\n- Chronic Conditions: ${medicalHistory.chronicConditions.join(', ')}`;
            }
            if (medicalHistory.currentMedications &&
                medicalHistory.currentMedications.length > 0) {
                const medList = medicalHistory.currentMedications
                    .map((med) => `${med.name} (${med.dosage})`)
                    .join(', ');
                prompt += `\n- Current Medications: ${medList}`;
            }
        }
        prompt += `\n\nProvide ONE practical, actionable tip (1-2 sentences max) based on ${pet.name}'s current needs and health status. Make it specific and helpful. Do not include the pet's name in the tip text itself.`;
        return prompt;
    }
    buildRecommendationsPrompt(pet, medicalHistory) {
        let prompt = `You are a veterinary assistant AI. Provide personalized recommendations for ${pet.name}:

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || 'Unknown'}
- Age: ${pet.age ? `${pet.age} years` : 'Unknown'}`;
        if (medicalHistory) {
            prompt += '\n\nMedical History:';
            if (medicalHistory.vaccinations &&
                medicalHistory.vaccinations.length > 0) {
                prompt += `\n- Vaccinations: ${medicalHistory.vaccinations.join(', ')}`;
            }
            else {
                prompt += '\n- Vaccinations: None recorded (may need core vaccines)';
            }
            if (medicalHistory.chronicConditions &&
                medicalHistory.chronicConditions.length > 0) {
                prompt += `\n- Chronic Conditions: ${medicalHistory.chronicConditions.join(', ')}`;
            }
            if (medicalHistory.currentMedications &&
                medicalHistory.currentMedications.length > 0) {
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
    buildRemindersPrompt(pet, medicalHistory) {
        let prompt = `Generate personalized reminders for ${pet.name}:

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Age: ${pet.age ? `${pet.age} years` : 'Unknown'}`;
        if (medicalHistory) {
            if (medicalHistory.currentMedications &&
                medicalHistory.currentMedications.length > 0) {
                prompt += '\n\nCurrent Medications:';
                for (const med of medicalHistory.currentMedications) {
                    prompt += `\n- ${med.name}: ${med.dosage}`;
                }
            }
            if (medicalHistory.vaccinations &&
                medicalHistory.vaccinations.length > 0) {
                prompt += `\n\nVaccinations: ${medicalHistory.vaccinations.join(', ')}`;
            }
            else {
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
    buildStatusPrompt(pet, medicalHistory) {
        let prompt = `Analyze the health status of ${pet.name} and provide a brief status:

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || 'Unknown'}
- Age: ${pet.age ? `${pet.age} years` : 'Unknown'}`;
        if (medicalHistory) {
            if (medicalHistory.vaccinations &&
                medicalHistory.vaccinations.length > 0) {
                prompt += `\n- Vaccinations: ${medicalHistory.vaccinations.join(', ')}`;
            }
            else {
                prompt += '\n- Vaccinations: None recorded (may need core vaccines)';
            }
            if (medicalHistory.chronicConditions &&
                medicalHistory.chronicConditions.length > 0) {
                prompt += `\n- Chronic Conditions: ${medicalHistory.chronicConditions.join(', ')}`;
            }
            if (medicalHistory.currentMedications &&
                medicalHistory.currentMedications.length > 0) {
                const medList = medicalHistory.currentMedications
                    .map((med) => `${med.name} (${med.dosage})`)
                    .join(', ');
                prompt += `\n- Current Medications: ${medList}`;
            }
        }
        prompt += `\n\nProvide a brief health status (one word or short phrase): "Healthy", "Needs Attention", "Due for Checkup", "On Medication", etc. Only return the status word/phrase, nothing else.`;
        return prompt;
    }
    parseTipsResponse(response, pet) {
        const lines = response
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        let tipText = lines[0] || response.trim();
        tipText = tipText.replace(/^[\d]+[\.\)]\s+/, '').trim();
        const emoji = this.getEmojiForPet(pet.species);
        return {
            emoji,
            title: `Tips about ${pet.name}`,
            detail: tipText,
        };
    }
    parseRecommendationsResponse(response) {
        const lines = response
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        const recommendations = [];
        let recommendationIndex = 0;
        for (const line of lines) {
            if (line.match(/^[\d]+[\.\)]\s+/) ||
                line.startsWith('- ') ||
                line.startsWith('• ')) {
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
    parseRemindersResponse(response, pet) {
        const lines = response
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        const reminders = [];
        let reminderIndex = 0;
        for (const line of lines) {
            if (line.match(/^[\d]+[\.\)]\s+/) ||
                line.startsWith('- ') ||
                line.startsWith('• ')) {
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
    parseStatusResponse(response, pet, medicalHistory) {
        const status = response.trim().split(/\s+/).slice(0, 3).join(' ');
        const pills = [];
        if (status.toLowerCase().includes('healthy')) {
            pills.push({
                text: 'Healthy',
                bg: '#10B981',
                fg: '#065F46',
            });
        }
        else if (status.toLowerCase().includes('attention') ||
            status.toLowerCase().includes('checkup')) {
            pills.push({
                text: 'Needs Attention',
                bg: '#F97316',
                fg: '#9A3412',
            });
        }
        else {
            pills.push({
                text: status,
                bg: '#EF4444',
                fg: '#991B1B',
            });
        }
        const summaryParts = [];
        if (medicalHistory?.vaccinations &&
            medicalHistory.vaccinations.length > 0) {
            summaryParts.push('✓ Up-to-date');
        }
        else {
            summaryParts.push('⚠ Needs vaccines');
        }
        const medCount = medicalHistory?.currentMedications?.length || 0;
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
    getCached(cache, key) {
        const cached = cache.get(key);
        if (!cached)
            return null;
        const age = Date.now() - cached.timestamp;
        if (age > this.cacheTTL) {
            cache.delete(key);
            return null;
        }
        this.logger.log(`📦 Returning cached response for ${key} (age: ${Math.floor(age / 1000)}s)`);
        return cached.data;
    }
    setCached(cache, key, data) {
        cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
    async generateTips(petId) {
        const cached = this.getCached(this.tipsCache, petId);
        if (cached) {
            return cached;
        }
        const staleCache = this.tipsCache.get(petId);
        if (staleCache) {
            this.logger.log(`📦 Returning stale cached tips for ${petId} (will refresh in background)`);
            this.refreshCacheInBackground(petId, () => this.fetchAndCacheTips(petId));
            return staleCache.data;
        }
        return this.fetchAndCacheTips(petId);
    }
    async fetchAndCacheTips(petId) {
        const { pet, medicalHistory } = await this.getPetWithHistory(petId);
        const prompt = this.buildTipsPrompt(pet, medicalHistory);
        try {
            const response = await this.geminiService.generateText(prompt, {
                temperature: 0.8,
                maxTokens: 2000,
            });
            const tip = this.parseTipsResponse(response, pet);
            const result = { tips: [tip] };
            this.setCached(this.tipsCache, petId, result);
            return result;
        }
        catch (error) {
            this.logger.error(`Error generating tips for pet ${petId}:`, error);
            const staleCache = this.tipsCache.get(petId);
            if (staleCache) {
                this.logger.warn(`⚠️ Returning stale cached tips for ${petId} due to error`);
                return staleCache.data;
            }
            if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
                throw new Error('AI service is not configured. Please contact support.');
            }
            if (error instanceof Error && error.message.includes('AI_DAILY_QUOTA_EXCEEDED')) {
                this.logger.error(`❌ Daily quota exceeded for ${petId}`);
                const stale = this.tipsCache.get(petId);
                if (stale) {
                    this.logger.warn(`⚠️ Returning stale cache due to daily quota exhaustion`);
                    return stale.data;
                }
                throw new Error('AI_DAILY_QUOTA_EXCEEDED: Daily quota exceeded. Please try again tomorrow.');
            }
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
    refreshCacheInBackground(petId, fetchFn) {
        fetchFn().catch((error) => {
            this.logger.warn(`Background refresh failed for ${petId}:`, error);
        });
    }
    async generateRecommendations(petId) {
        const cached = this.getCached(this.recommendationsCache, petId);
        if (cached) {
            return cached;
        }
        const { pet, medicalHistory } = await this.getPetWithHistory(petId);
        const prompt = this.buildRecommendationsPrompt(pet, medicalHistory);
        try {
            const response = await this.geminiService.generateText(prompt, {
                temperature: 0.7,
                maxTokens: 2000,
            });
            const recommendations = this.parseRecommendationsResponse(response);
            const result = { recommendations };
            this.setCached(this.recommendationsCache, petId, result);
            return result;
        }
        catch (error) {
            this.logger.error(`Error generating recommendations for pet ${petId}:`, error);
            const staleCache = this.recommendationsCache.get(petId);
            if (staleCache) {
                this.logger.warn(`⚠️ Returning stale cached recommendations for ${petId} due to error`);
                return staleCache.data;
            }
            if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
                throw new Error('AI service is not configured. Please contact support.');
            }
            if (error instanceof Error && error.message.includes('AI_DAILY_QUOTA_EXCEEDED')) {
                const stale = this.recommendationsCache.get(petId);
                if (stale) {
                    this.logger.warn(`⚠️ Returning stale cache due to daily quota exhaustion`);
                    return stale.data;
                }
                throw new Error('AI_DAILY_QUOTA_EXCEEDED: Daily quota exceeded. Please try again tomorrow.');
            }
            if (error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('429'))) {
                const stale = this.recommendationsCache.get(petId);
                if (stale) {
                    return stale.data;
                }
            }
            throw error;
        }
    }
    async generateReminders(petId) {
        const cached = this.getCached(this.remindersCache, petId);
        if (cached) {
            return cached;
        }
        const { pet, medicalHistory } = await this.getPetWithHistory(petId);
        const prompt = this.buildRemindersPrompt(pet, medicalHistory);
        try {
            const response = await this.geminiService.generateText(prompt, {
                temperature: 0.7,
                maxTokens: 2000,
            });
            const reminders = this.parseRemindersResponse(response, pet);
            const result = { reminders };
            this.setCached(this.remindersCache, petId, result);
            return result;
        }
        catch (error) {
            this.logger.error(`Error generating reminders for pet ${petId}:`, error);
            const staleCache = this.remindersCache.get(petId);
            if (staleCache) {
                this.logger.warn(`⚠️ Returning stale cached reminders for ${petId} due to error`);
                return staleCache.data;
            }
            if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
                throw new Error('AI service is not configured. Please contact support.');
            }
            if (error instanceof Error && error.message.includes('AI_DAILY_QUOTA_EXCEEDED')) {
                const stale = this.remindersCache.get(petId);
                if (stale) {
                    this.logger.warn(`⚠️ Returning stale cache due to daily quota exhaustion`);
                    return stale.data;
                }
                throw new Error('AI_DAILY_QUOTA_EXCEEDED: Daily quota exceeded. Please try again tomorrow.');
            }
            if (error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('429'))) {
                const stale = this.remindersCache.get(petId);
                if (stale) {
                    return stale.data;
                }
            }
            throw error;
        }
    }
    async generateStatus(petId) {
        const cached = this.getCached(this.statusCache, petId);
        if (cached) {
            return cached;
        }
        const { pet, medicalHistory } = await this.getPetWithHistory(petId);
        const prompt = this.buildStatusPrompt(pet, medicalHistory);
        try {
            const response = await this.geminiService.generateText(prompt, {
                temperature: 0.6,
                maxTokens: 1000,
            });
            const result = this.parseStatusResponse(response, pet, medicalHistory);
            this.setCached(this.statusCache, petId, result);
            return result;
        }
        catch (error) {
            this.logger.error(`Error generating status for pet ${petId}:`, error);
            const staleCache = this.statusCache.get(petId);
            if (staleCache) {
                this.logger.warn(`⚠️ Returning stale cached status for ${petId} due to error`);
                return staleCache.data;
            }
            if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
                throw new Error('AI service is not configured. Please contact support.');
            }
            if (error instanceof Error && error.message.includes('AI_DAILY_QUOTA_EXCEEDED')) {
                const stale = this.statusCache.get(petId);
                if (stale) {
                    this.logger.warn(`⚠️ Returning stale cache due to daily quota exhaustion`);
                    return stale.data;
                }
                throw new Error('AI_DAILY_QUOTA_EXCEEDED: Daily quota exceeded. Please try again tomorrow.');
            }
            if (error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('429'))) {
                const stale = this.statusCache.get(petId);
                if (stale) {
                    return stale.data;
                }
            }
            throw error;
        }
    }
    getEmojiForPet(species) {
        const lower = species.toLowerCase();
        if (lower.includes('dog'))
            return '🐕';
        if (lower.includes('cat'))
            return '🐈';
        if (lower.includes('bird'))
            return '🐦';
        return '🐾';
    }
    getRecommendationType(text) {
        const lower = text.toLowerCase();
        if (lower.includes('vaccin'))
            return 'vaccination';
        if (lower.includes('medic') || lower.includes('pill'))
            return 'medication';
        if (lower.includes('check') || lower.includes('appointment'))
            return 'checkup';
        return 'general';
    }
    getRecommendationTitle(text, type) {
        if (type === 'vaccination')
            return 'Vaccination Schedule';
        if (type === 'medication')
            return 'Medication Reminder';
        if (type === 'checkup')
            return 'Health Check-up';
        return 'General Recommendation';
    }
    extractDateFromText(text) {
        const now = new Date();
        const lower = text.toLowerCase();
        if (lower.includes('today')) {
            return now;
        }
        else if (lower.includes('tomorrow')) {
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
        else if (lower.includes('week')) {
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        else if (lower.includes('month')) {
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
    getIconForReminder(text) {
        const lower = text.toLowerCase();
        if (lower.includes('vaccin'))
            return 'syringe.fill';
        if (lower.includes('medic') || lower.includes('pill'))
            return 'pills.fill';
        if (lower.includes('appointment') || lower.includes('check'))
            return 'calendar.badge.clock';
        if (lower.includes('groom'))
            return 'scissors';
        return 'bell.fill';
    }
    getReminderTitle(text) {
        const words = text.split(/\s+/);
        if (words.length > 5) {
            return words.slice(0, 4).join(' ');
        }
        return text;
    }
    getTintForReminder(text) {
        const lower = text.toLowerCase();
        if (lower.includes('vaccin'))
            return '#10B981';
        if (lower.includes('medic') || lower.includes('pill'))
            return '#3B82F6';
        if (lower.includes('appointment'))
            return '#EF4444';
        return '#8B5CF6';
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(pet_schema_1.Pet.name)),
    __param(1, (0, mongoose_1.InjectModel)(medical_history_schema_1.MedicalHistory.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        gemini_service_1.GeminiService])
], AiService);
//# sourceMappingURL=ai.service.js.map