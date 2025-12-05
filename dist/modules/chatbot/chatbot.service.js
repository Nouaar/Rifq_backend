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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ChatbotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
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
            prompt += `\n\nIMPORTANT: Provide veterinary advice including possible diagnoses, recommendations, tips, and descriptions. If the question is about a specific pet, reference the pet by name. You can suggest possible conditions based on symptoms, but always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation, proper diagnosis, and treatment.`;
            return prompt;
        }
        catch (error) {
            this.logger.error('Error building contextual prompt:', error);
            return this.buildDefaultPrompt(userMessage, context);
        }
    }
    buildDefaultPrompt(userMessage, context) {
        let prompt = `You are a Vet AI assistant for the Rifq pet care app. You provide veterinary advice including diagnoses, recommendations, tips, and descriptions about pet health and care. You can analyze symptoms, suggest possible conditions, and provide guidance.

User Question: ${userMessage}`;
        if (context) {
            prompt += `\n\nContext: ${context}`;
        }
        prompt += `\n\nProvide veterinary advice including possible diagnoses, recommendations, tips, and descriptions. Always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation and proper treatment.`;
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
                const petsWithHistory = await this.getUserPetsWithHistory(userId);
                const petPhotos = await this.getPetPhotosForComparison(petsWithHistory);
                const imagePrompt = await this.buildImageAnalysisPrompt(userId, chatbotMessageDto.message, history, chatbotMessageDto.context, petPhotos);
                this.logger.log(`Processing chatbot message with image for user ${userId} (${chatbotMessageDto.message.length} chars, ${petPhotos.length} pet photos for comparison)`);
                response = await this.chatbotGeminiService.analyzeImageWithPetPhotos(chatbotMessageDto.image, imagePrompt, petPhotos, {
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
    async downloadImageAsBase64(imageUrl) {
        try {
            const response = await axios_1.default.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 10000,
            });
            const buffer = Buffer.from(response.data);
            const base64 = buffer.toString('base64');
            const contentType = response.headers['content-type'] || 'image/jpeg';
            return `data:${contentType};base64,${base64}`;
        }
        catch (error) {
            this.logger.warn(`Failed to download pet photo from ${imageUrl}:`, error);
            return null;
        }
    }
    async getPetPhotosForComparison(petsWithHistory) {
        const petPhotos = [];
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
    async buildImageAnalysisPrompt(userId, userMessage, history, context, petPhotos) {
        try {
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
            if (history.length > 0) {
                prompt += this.buildConversationContext(history);
                prompt += '\n\n';
            }
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
        }
        catch (error) {
            this.logger.error('Error building image analysis prompt:', error);
            return `You are a Vet AI assistant. Analyze this pet image and provide veterinary insights including possible diagnoses, observations, recommendations, and tips. Answer: "${userMessage}". Remind users that this is AI assistance and they should consult a licensed veterinarian for confirmation and treatment.`;
        }
    }
    async buildContextualPromptWithHistory(userId, userMessage, history, context) {
        try {
            const petsWithHistory = await this.getUserPetsWithHistory(userId);
            let prompt = `You are a Vet AI assistant for the Rifq pet care app. You provide veterinary advice including diagnoses, recommendations, tips, and descriptions about pet health and care. You can analyze symptoms, suggest possible conditions, and provide guidance based on the pet's profile. However, always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation and treatment.

USER'S PETS INFORMATION:`;
            prompt += this.buildPetInformationString(petsWithHistory);
            prompt += `\n\nUSER QUESTION: ${userMessage}`;
            if (history.length > 0) {
                prompt += this.buildConversationContext(history);
            }
            if (context) {
                prompt += `\n\nAdditional Context: ${context}`;
            }
            prompt += `\n\nIMPORTANT: Provide a CONCISE response (2-4 sentences maximum) with veterinary advice including possible diagnoses, recommendations, tips, and descriptions. Be direct and to the point. If the question is about a specific pet, reference the pet by name and consider their medical history (vaccinations, conditions, medications) when providing advice. You can suggest possible conditions based on symptoms, but always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation and proper treatment.`;
            return prompt;
        }
        catch (error) {
            this.logger.error('Error building contextual prompt:', error);
            return this.buildDefaultPromptWithHistory(userMessage, history, context);
        }
    }
    buildDefaultPromptWithHistory(userMessage, history, context) {
        let prompt = `You are a Vet AI assistant for the Rifq pet care app. You provide veterinary advice including diagnoses, recommendations, tips, and descriptions about pet health and care. You can analyze symptoms, suggest possible conditions, and provide guidance.

User Question: ${userMessage}`;
        if (history.length > 0) {
            prompt += this.buildConversationContext(history);
        }
        if (context) {
            prompt += `\n\nAdditional Context: ${context}`;
        }
        prompt += `\n\nIMPORTANT: Provide a CONCISE response (2-4 sentences maximum) with veterinary advice including possible diagnoses, recommendations, tips, and descriptions. Be direct and to the point. You can suggest possible conditions based on symptoms, but always remind users that this is AI assistance and they should consult with a licensed veterinarian for confirmation and proper treatment.`;
        return prompt;
    }
    async analyzeImage(userId, imageAnalysisDto) {
        try {
            const petsWithHistory = await this.getUserPetsWithHistory(userId);
            const petPhotos = await this.getPetPhotosForComparison(petsWithHistory);
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
            }
            else {
                prompt += `\n\nAnalyze this pet image and provide health insights, observations, and any recommendations.`;
            }
            prompt += `\n\nIMPORTANT: Provide a CONCISE analysis (3-5 sentences maximum) with veterinary insights:
- FIRST identifies which pet this is by comparing with reference photos (if available): "This appears to be [Pet Name] based on the comparison with their profile photo"
- Describe what you observe in the image and suggest possible diagnoses or conditions
- Mention 1-2 health observations or potential issues you identify
- Consider the identified pet's medical history (vaccinations, conditions, medications) when providing advice
- Give 1-2 recommendations or tips
- Remind users that this is AI assistance and they should consult a licensed veterinarian for confirmation and treatment`;
            this.logger.log(`Analyzing image for user ${userId} (${imageAnalysisDto.image.length} chars base64, ${petPhotos.length} pet photos for comparison)`);
            const response = await this.chatbotGeminiService.analyzeImageWithPetPhotos(imageAnalysisDto.image, prompt, petPhotos, {
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