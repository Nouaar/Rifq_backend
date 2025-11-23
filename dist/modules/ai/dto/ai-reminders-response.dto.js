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
exports.AiRemindersResponseDto = exports.ReminderItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ReminderItemDto {
}
exports.ReminderItemDto = ReminderItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'syringe.fill',
        description: 'Icon name for the reminder',
    }),
    __metadata("design:type", String)
], ReminderItemDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Luna • Vaccination Booster',
        description: 'Title of the reminder',
    }),
    __metadata("design:type", String)
], ReminderItemDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Feline FVCRP booster due soon.',
        description: 'Detail description of the reminder',
    }),
    __metadata("design:type", String)
], ReminderItemDto.prototype, "detail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2024-12-01T10:00:00Z',
        description: 'Date and time for the reminder',
    }),
    __metadata("design:type", String)
], ReminderItemDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '#FF6B6B',
        description: 'Color tint for the reminder',
    }),
    __metadata("design:type", String)
], ReminderItemDto.prototype, "tint", void 0);
class AiRemindersResponseDto {
}
exports.AiRemindersResponseDto = AiRemindersResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [ReminderItemDto],
        description: 'List of reminders for the pet',
    }),
    __metadata("design:type", Array)
], AiRemindersResponseDto.prototype, "reminders", void 0);
//# sourceMappingURL=ai-reminders-response.dto.js.map