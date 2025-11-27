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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotImageAnalysisDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ChatbotImageAnalysisDto {
}
exports.ChatbotImageAnalysisDto = ChatbotImageAnalysisDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Base64 encoded image data (with or without data URI prefix)',
        example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChatbotImageAnalysisDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional prompt/question about the image',
        example: 'What health issues do you see in this pet image?',
        default: 'Analyze this pet image and provide health insights.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChatbotImageAnalysisDto.prototype, "prompt", void 0);
//# sourceMappingURL=chatbot-image-analysis.dto.js.map