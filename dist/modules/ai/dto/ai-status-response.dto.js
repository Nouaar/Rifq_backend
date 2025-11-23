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
exports.AiStatusResponseDto = exports.StatusPillDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class StatusPillDto {
}
exports.StatusPillDto = StatusPillDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Healthy', description: 'Text for the status pill' }),
    __metadata("design:type", String)
], StatusPillDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '#10B981', description: 'Background color' }),
    __metadata("design:type", String)
], StatusPillDto.prototype, "bg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '#065F46', description: 'Foreground color' }),
    __metadata("design:type", String)
], StatusPillDto.prototype, "fg", void 0);
class AiStatusResponseDto {
}
exports.AiStatusResponseDto = AiStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Healthy', description: 'Overall health status' }),
    __metadata("design:type", String)
], AiStatusResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [StatusPillDto],
        description: 'Status pills to display',
    }),
    __metadata("design:type", Array)
], AiStatusResponseDto.prototype, "pills", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '✓ Up-to-date | 2 med | 30 kg',
        description: 'Summary text',
    }),
    __metadata("design:type", String)
], AiStatusResponseDto.prototype, "summary", void 0);
//# sourceMappingURL=ai-status-response.dto.js.map