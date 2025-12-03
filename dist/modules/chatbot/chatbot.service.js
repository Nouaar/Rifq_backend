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
var ChatbotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chatbot_gemini_service_1 = require("./chatbot-gemini.service");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const pet_schema_1 = require("../pets/schemas/pet.schema");
const medical_history_schema_1 = require("../pets/schemas/medical-history.schema");
const chatbot_message_schema_1 = require("./schemas/chatbot-message.schema");
let ChatbotService = ChatbotService_1 = class ChatbotService {
    constructor(chatbotGeminiService, cloudinaryService, userModel, petModel, medicalHistoryModel, chatbotMessageModel) {
        this.chatbotGeminiService = chatbotGeminiService;
        this.cloudinaryService = cloudinaryService;
        this.userModel = userModel;
        this.petModel = petModel;
        this.medicalHistoryModel = medicalHistoryModel;
        this.chatbotMessageModel = chatbotMessageModel;
        this.logger = new common_1.Logger(ChatbotService_1.name);
    }
    async getUserPetsWithHistory(userId) {
        const ownerObjectId = new mongoose_2.Types.ObjectId(userId);
        const pets = await this.petModel
            .find({ owner: ownerObjectId })
            .populate('medicalHistory')
            .limit(10)
            .exec();
        this.logger.log(`Found ${pets.length} pets for user ${userId}`);
        if (pets.length > 0) {
            const petNames = pets.map((p) => p.name).join(', ');
            this.logger.log(`Pet names: ${petNames}`);
        }
        const petsWithHistory = await Promise.all(pets.map(async (pet) => {
            let medicalHistory = null;
            if (pet.medicalHistory) {
                medicalHistory = await this.medicalHistoryModel.findById(pet.medicalHistory);
            }
            return { pet, medicalHistory };
        }));
        this.logger.log(`Returning ${petsWithHistory.length} pets with history for user ${userId}`);
        return petsWithHistory;
    }
    buildPetInformationString(petsWithHistory) {
        if (petsWithHistory.length === 0) {
            this.logger.warn('No pets found for user - returning empty pet info');
            return '\n\nNo pets registered yet.';
        }
        this.logger.log(`Building pet info string for ${petsWithHistory.length} pets`);
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
            if (medicalHistory) {
                if (medicalHistory.vaccinations &&
                    medicalHistory.vaccinations.length > 0) {
                    petInfo += `\n- Vaccinations: ${medicalHistory.vaccinations.join(', ')}`;
                }
                else {
                    petInfo += `\n- Vaccinations: None recorded (may need core vaccines)`;
                }
                if (medicalHistory.chronicConditions &&
                    medicalHistory.chronicConditions.length > 0) {
                    petInfo += `\n- Chronic Conditions: ${medicalHistory.chronicConditions.join(', ')}`;
                }
                if (medicalHistory.currentMedications &&
                    medicalHistory.currentMedications.length > 0) {
                    const meds = medicalHistory.currentMedications
                        .map((m) => `${m.name} (${m.dosage})`)
                        .join(', ');
                    petInfo += `\n- Current Medications: ${meds}`;
                }
            }
            else {
                petInfo += `\n- Medical History: Not available`;
            }
        }
        return petInfo;
    }
    async getConversationHistory(userId, limit = 10) {
        return (await this.chatbotMessageModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec());
    }
    buildConversationContext(history) {
        if (history.length === 0) {
            return '';
        }
        const chronologicalHistory = [...history].reverse();
        let context = '\n\nPrevious Conversation:';
        for (const msg of chronologicalHistory) {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            context += `\n${role}: ${msg.content}`;
        }
        return context;
    }
    async buildContextualPrompt(userId, userMessage, context, includeHistory = true) {
        try {
            const user = await this.userModel.findById(userId).populate('pets');
            if (!user) {
                return this.buildDefaultPrompt(userMessage, context);
            }
            const pets = await this.petModel
                .find({ owner: userId })
                .populate('medicalHistory')
                .limit(5);
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
                        const history = await this.medicalHistoryModel.findById(pet.medicalHistory);
                        if (history) {
                            if (history.vaccinations && history.vaccinations.length > 0) {
                                prompt += `\n  Vaccinations: ${history.vaccinations.join(', ')}`;
                            }
                            if (history.chronicConditions &&
                                history.chronicConditions.length > 0) {
                                prompt += `\n  Conditions: ${history.chronicConditions.join(', ')}`;
                            }
                            if (history.currentMedications &&
                                history.currentMedications.length > 0) {
                                const meds = history.currentMedications
                                    .map((m) => `${m.name} (${m.dosage})`)
                                    .join(', ');
                                prompt += `\n  Medications: ${meds}`;
                            }
                        }
                    }
                }
            }
            else {
                prompt += '\n\nNo pets registered yet.';
            }
            prompt += `\n\nUser Question: ${userMessage}`;
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
        }
        catch (error) {
            this.logger.error('Error building contextual prompt:', error);
            return this.buildDefaultPrompt(userMessage, context);
        }
    }
    buildDefaultPrompt(userMessage, context) {
        let prompt = `You are a helpful veterinary AI assistant for the Rifq pet care app. You provide friendly, accurate, and practical advice about pet care, health, and wellness.

User Question: ${userMessage}`;
        if (context) {
            prompt += `\n\nContext: ${context}`;
        }
        prompt += `\n\nProvide a helpful, accurate, and friendly response. Always remind users to consult with a veterinarian for serious health concerns.`;
        return prompt;
    }
    async processMessage(userId, chatbotMessageDto) {
        try {
            const history = await this.getConversationHistory(userId, 10);
            let imageUrl;
            if (chatbotMessageDto.image) {
                try {
                    const uploadResult = await this.cloudinaryService.uploadImageFromBase64(chatbotMessageDto.image, 'chatbot/images');
                    imageUrl = uploadResult.secure_url;
                    this.logger.log(`Image uploaded to Cloudinary: ${imageUrl}`);
                }
                catch (error) {
                    this.logger.error('Failed to upload image to Cloudinary:', error instanceof Error ? error.message : String(error));
                }
            }
            const userMessage = new this.chatbotMessageModel({
                userId,
                role: 'user',
                content: chatbotMessageDto.message,
                imageUrl,
                imagePrompt: chatbotMessageDto.message,
            });
            await userMessage.save();
            let response;
            if (chatbotMessageDto.image) {
                const imagePrompt = await this.buildImageAnalysisPrompt(userId, chatbotMessageDto.message, history, chatbotMessageDto.context);
                this.logger.log(`Processing chatbot message with image for user ${userId} (${chatbotMessageDto.message.length} chars)`);
                response = await this.chatbotGeminiService.analyzeImage(chatbotMessageDto.image, imagePrompt, {
                    temperature: 0.7,
                    maxTokens: 500,
                });
            }
            else {
                const prompt = await this.buildContextualPromptWithHistory(userId, chatbotMessageDto.message, history, chatbotMessageDto.context);
                this.logger.log(`Processing chatbot message for user ${userId} (${chatbotMessageDto.message.length} chars)`);
                response = await this.chatbotGeminiService.generateText(prompt, {
                    temperature: 0.7,
                    maxTokens: 500,
                });
            }
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
        }
        catch (error) {
            this.logger.error('Error processing chatbot message:', error);
            throw error;
        }
    }
    async buildImageAnalysisPrompt(userId, userMessage, history, context) {
        try {
            const petsWithHistory = await this.getUserPetsWithHistory(userId);
            let prompt = `You are a veterinary AI assistant. Analyze this pet image and answer the user's question: "${userMessage}"

USER'S PETS INFORMATION:`;
            prompt += this.buildPetInformationString(petsWithHistory);
            prompt += `\n\nUSER QUESTION: "${userMessage}"`;
            if (history.length > 0) {
                prompt += this.buildConversationContext(history);
                prompt += '\n\n';
            }
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
        }
        catch (error) {
            this.logger.error('Error building image analysis prompt:', error);
            return `Analyze this pet image and answer: "${userMessage}". Provide health insights and recommendations.`;
        }
    }
    async buildContextualPromptWithHistory(userId, userMessage, history, context) {
        try {
            const petsWithHistory = await this.getUserPetsWithHistory(userId);
            let prompt = `You are a helpful veterinary AI assistant for the Rifq pet care app. You provide friendly, accurate, and practical advice about pet care, health, and wellness.

USER'S PETS INFORMATION:`;
            prompt += this.buildPetInformationString(petsWithHistory);
            prompt += `\n\nUSER QUESTION: ${userMessage}`;
            if (history.length > 0) {
                prompt += this.buildConversationContext(history);
            }
            if (context) {
                prompt += `\n\nAdditional Context: ${context}`;
            }
            prompt += `\n\nIMPORTANT: Provide a CONCISE and helpful response (2-4 sentences maximum). Be direct and to the point. If the question is about a specific pet, reference the pet by name and consider their medical history (vaccinations, conditions, medications) when providing advice. Always remind users to consult with a veterinarian for serious health concerns.`;
            return prompt;
        }
        catch (error) {
            this.logger.error('Error building contextual prompt:', error);
            return this.buildDefaultPromptWithHistory(userMessage, history, context);
        }
    }
    buildDefaultPromptWithHistory(userMessage, history, context) {
        let prompt = `You are a helpful veterinary AI assistant for the Rifq pet care app. You provide friendly, accurate, and practical advice about pet care, health, and wellness.

User Question: ${userMessage}`;
        if (history.length > 0) {
            prompt += this.buildConversationContext(history);
        }
        if (context) {
            prompt += `\n\nAdditional Context: ${context}`;
        }
        prompt += `\n\nIMPORTANT: Provide a CONCISE and helpful response (2-4 sentences maximum). Be direct and to the point. Always remind users to consult with a veterinarian for serious health concerns.`;
        return prompt;
    }
    async analyzeImage(userId, imageAnalysisDto) {
        try {
            const petsWithHistory = await this.getUserPetsWithHistory(userId);
            let prompt = `You are a veterinary AI assistant. Analyze this pet image and provide health insights, observations, and recommendations.

USER'S PETS INFORMATION:`;
            prompt += this.buildPetInformationString(petsWithHistory);
            if (imageAnalysisDto.prompt) {
                prompt += `\n\nUSER QUESTION: ${imageAnalysisDto.prompt}`;
            }
            else {
                prompt += `\n\nAnalyze this pet image and provide health insights, observations, and any recommendations.`;
            }
            prompt += `\n\nIMPORTANT: Provide a CONCISE analysis (3-5 sentences maximum):
- Briefly describe what you observe in the image
- Reference specific pet by name if you can identify which pet it is
- Mention 1-2 key health concerns or positive indicators
- Consider the pet's medical history (vaccinations, conditions, medications) when relevant
- Give 1-2 actionable recommendations
- Remind to consult a veterinarian for serious concerns`;
            this.logger.log(`Analyzing image for user ${userId} (${imageAnalysisDto.image.length} chars base64)`);
            const response = await this.chatbotGeminiService.analyzeImage(imageAnalysisDto.image, prompt, {
                temperature: 0.7,
                maxTokens: 500,
            });
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
        }
        catch (error) {
            this.logger.error('Error analyzing image:', error);
            throw error;
        }
    }
    async getHistory(userId, limit = 50, offset = 0) {
        const messages = await this.chatbotMessageModel
            .find({ userId })
            .sort({ createdAt: 1 })
            .skip(offset)
            .limit(limit)
            .exec();
        const total = await this.chatbotMessageModel.countDocuments({ userId });
        const messageDtos = messages.map((msg) => ({
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
    async clearHistory(userId) {
        await this.chatbotMessageModel.deleteMany({ userId });
        return { message: 'Conversation history cleared successfully' };
    }
};
exports.ChatbotService = ChatbotService;
exports.ChatbotService = ChatbotService = ChatbotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)('User')),
    __param(3, (0, mongoose_1.InjectModel)(pet_schema_1.Pet.name)),
    __param(4, (0, mongoose_1.InjectModel)(medical_history_schema_1.MedicalHistory.name)),
    __param(5, (0, mongoose_1.InjectModel)(chatbot_message_schema_1.ChatbotMessage.name)),
    __metadata("design:paramtypes", [chatbot_gemini_service_1.ChatbotGeminiService,
        cloudinary_service_1.CloudinaryService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ChatbotService);
//# sourceMappingURL=chatbot.service.js.map