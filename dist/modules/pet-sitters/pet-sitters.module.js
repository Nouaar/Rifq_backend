"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetSittersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const pet_sitters_service_1 = require("./pet-sitters.service");
const pet_sitters_controller_1 = require("./pet-sitters.controller");
const user_schema_1 = require("../users/schemas/user.schema");
const pet_sitter_schema_1 = require("./schemas/pet-sitter.schema");
const users_module_1 = require("../users/users.module");
const mail_module_1 = require("../mail/mail.module");
let PetSittersModule = class PetSittersModule {
};
exports.PetSittersModule = PetSittersModule;
exports.PetSittersModule = PetSittersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: pet_sitter_schema_1.PetSitter.name, schema: pet_sitter_schema_1.PetSitterSchema },
            ]),
            users_module_1.UsersModule,
            mail_module_1.MailModule,
        ],
        controllers: [pet_sitters_controller_1.PetSittersController],
        providers: [pet_sitters_service_1.PetSittersService],
        exports: [pet_sitters_service_1.PetSittersService],
    })
], PetSittersModule);
//# sourceMappingURL=pet-sitters.module.js.map