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
exports.AiRecommendationsResponseDto = exports.RecommendationItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class RecommendationItemDto {
}
exports.RecommendationItemDto = RecommendationItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Vaccination Schedule',
        description: 'Title of the recommendation',
    }),
    __metadata("design:type", String)
], RecommendationItemDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Schedule FVCRP booster within the next 2 weeks',
        description: 'Detail description of the recommendation',
    }),
    __metadata("design:type", String)
], RecommendationItemDto.prototype, "detail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'vaccination',
        description: 'Type of recommendation',
    }),
    __metadata("design:type", String)
], RecommendationItemDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2024-12-01',
        description: 'Suggested date (optional)',
        required: false,
    }),
    __metadata("design:type", String)
], RecommendationItemDto.prototype, "suggestedDate", void 0);
class AiRecommendationsResponseDto {
}
exports.AiRecommendationsResponseDto = AiRecommendationsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [RecommendationItemDto],
        description: 'List of recommendations for the pet',
    }),
    __metadata("design:type", Array)
], AiRecommendationsResponseDto.prototype, "recommendations", void 0);
//# sourceMappingURL=ai-recommendations-response.dto.js.map