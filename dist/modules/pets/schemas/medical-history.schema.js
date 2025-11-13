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
exports.MedicalHistorySchema = exports.MedicalHistory = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let MedicalHistory = class MedicalHistory extends mongoose_2.Document {
};
exports.MedicalHistory = MedicalHistory;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Pet', required: true, unique: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MedicalHistory.prototype, "pet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], MedicalHistory.prototype, "vaccinations", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], MedicalHistory.prototype, "chronicConditions", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                name: { type: String, required: true },
                dosage: { type: String, required: true },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], MedicalHistory.prototype, "currentMedications", void 0);
exports.MedicalHistory = MedicalHistory = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MedicalHistory);
exports.MedicalHistorySchema = mongoose_1.SchemaFactory.createForClass(MedicalHistory);
exports.MedicalHistorySchema.index({ pet: 1 }, { unique: true });
//# sourceMappingURL=medical-history.schema.js.map