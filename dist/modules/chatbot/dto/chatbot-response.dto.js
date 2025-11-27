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
exports.ChatbotResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ChatbotResponseDto {
}
exports.ChatbotResponseDto = ChatbotResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'AI-generated response',
        example: 'Based on the image, I can see...',
    }),
    __metadata("design:type", String)
], ChatbotResponseDto.prototype, "response", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp of the response',
        example: '2025-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], ChatbotResponseDto.prototype, "timestamp", void 0);
//# sourceMappingURL=chatbot-response.dto.js.map