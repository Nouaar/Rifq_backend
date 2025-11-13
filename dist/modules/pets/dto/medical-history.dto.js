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
exports.UpdateMedicalHistoryDto = exports.CreateMedicalHistoryDto = exports.MedicationDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mapped_types_1 = require("@nestjs/mapped-types");
class MedicationDto {
}
exports.MedicationDto = MedicationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "dosage", void 0);
class CreateMedicalHistoryDto {
}
exports.CreateMedicalHistoryDto = CreateMedicalHistoryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMedicalHistoryDto.prototype, "vaccinations", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMedicalHistoryDto.prototype, "chronicConditions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MedicationDto),
    __metadata("design:type", Array)
], CreateMedicalHistoryDto.prototype, "currentMedications", void 0);
class UpdateMedicalHistoryDto extends (0, mapped_types_1.PartialType)(CreateMedicalHistoryDto) {
}
exports.UpdateMedicalHistoryDto = UpdateMedicalHistoryDto;
//# sourceMappingURL=medical-history.dto.js.map