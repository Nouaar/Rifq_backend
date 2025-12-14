"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const schedule_1 = require("@nestjs/schedule");
const subscriptions_service_1 = require("./subscriptions.service");
const subscriptions_controller_1 = require("./subscriptions.controller");
const subscriptions_webhook_controller_1 = require("./subscriptions.webhook.controller");
const subscriptions_scheduler_1 = require("./subscriptions.scheduler");
const subscription_schema_1 = require("./schemas/subscription.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const users_module_1 = require("../users/users.module");
const veterinarians_module_1 = require("../veterinarians/veterinarians.module");
const pet_sitters_module_1 = require("../pet-sitters/pet-sitters.module");
const mail_module_1 = require("../mail/mail.module");
let SubscriptionsModule = class SubscriptionsModule {
};
exports.SubscriptionsModule = SubscriptionsModule;
exports.SubscriptionsModule = SubscriptionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: subscription_schema_1.Subscription.name, schema: subscription_schema_1.SubscriptionSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            users_module_1.UsersModule,
            veterinarians_module_1.VeterinariansModule,
            pet_sitters_module_1.PetSittersModule,
            mail_module_1.MailModule,
        ],
        controllers: [subscriptions_controller_1.SubscriptionsController, subscriptions_webhook_controller_1.SubscriptionsWebhookController],
        providers: [subscriptions_service_1.SubscriptionsService, subscriptions_scheduler_1.SubscriptionsScheduler],
        exports: [subscriptions_service_1.SubscriptionsService],
    })
], SubscriptionsModule);
//# sourceMappingURL=subscriptions.module.js.map