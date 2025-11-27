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
exports.ChatbotHistoryResponseDto = exports.ChatbotMessageItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ChatbotMessageItemDto {
}
exports.ChatbotMessageItemDto = ChatbotMessageItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message ID' }),
    __metadata("design:type", String)
], ChatbotMessageItemDto.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message role: user or assistant', enum: ['user', 'assistant'] }),
    __metadata("design:type", String)
], ChatbotMessageItemDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message content' }),
    __metadata("design:type", String)
], ChatbotMessageItemDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Optional image URL', required: false }),
    __metadata("design:type", String)
], ChatbotMessageItemDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Optional image prompt', required: false }),
    __metadata("design:type", String)
], ChatbotMessageItemDto.prototype, "imagePrompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message creation timestamp' }),
    __metadata("design:type", Date)
], ChatbotMessageItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message update timestamp' }),
    __metadata("design:type", Date)
], ChatbotMessageItemDto.prototype, "updatedAt", void 0);
class ChatbotHistoryResponseDto {
}
exports.ChatbotHistoryResponseDto = ChatbotHistoryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of messages in chronological order',
        type: [ChatbotMessageItemDto],
    }),
    __metadata("design:type", Array)
], ChatbotHistoryResponseDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of messages in history' }),
    __metadata("design:type", Number)
], ChatbotHistoryResponseDto.prototype, "total", void 0);
//# sourceMappingURL=chatbot-history-response.dto.js.map