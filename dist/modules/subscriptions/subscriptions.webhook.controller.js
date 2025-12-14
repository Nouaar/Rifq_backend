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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsWebhookController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
const subscriptions_service_1 = require("./subscriptions.service");
let SubscriptionsWebhookController = class SubscriptionsWebhookController {
    constructor(subscriptionsService, configService) {
        this.subscriptionsService = subscriptionsService;
        this.configService = configService;
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (stripeSecretKey) {
            this.stripe = new stripe_1.default(stripeSecretKey, {
                apiVersion: '2025-11-17.clover',
            });
        }
        this.webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET') || '';
    }
    async handleWebhook(request, signature) {
        if (!this.stripe || !this.webhookSecret) {
            console.warn('⚠️ Stripe webhook received but Stripe is not configured');
            return { received: true };
        }
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(request.rawBody, signature, this.webhookSecret);
        }
        catch (err) {
            console.error('⚠️ Webhook signature verification failed:', err.message);
            throw new common_1.BadRequestException(`Webhook Error: ${err.message}`);
        }
        console.log(`📥 Received Stripe webhook: ${event.type}`);
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentIntentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await this.handlePaymentIntentFailed(event.data.object);
                break;
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        return { received: true };
    }
    async handlePaymentIntentSucceeded(paymentIntent) {
        console.log('✅ Payment succeeded for PaymentIntent:', paymentIntent.id);
        const userId = paymentIntent.metadata?.userId;
        const subscriptionRole = paymentIntent.metadata?.subscriptionRole || 'premium';
        if (userId) {
            await this.subscriptionsService.createSubscriptionAfterPayment(userId, paymentIntent.customer, subscriptionRole);
        }
    }
    async handlePaymentIntentFailed(paymentIntent) {
        console.log('❌ Payment failed for PaymentIntent:', paymentIntent.id);
    }
    async handleSubscriptionUpdated(subscription) {
        console.log('🔄 Subscription updated:', subscription.id);
    }
    async handleSubscriptionDeleted(subscription) {
        console.log('🗑️ Subscription deleted:', subscription.id);
    }
};
exports.SubscriptionsWebhookController = SubscriptionsWebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsWebhookController.prototype, "handleWebhook", null);
exports.SubscriptionsWebhookController = SubscriptionsWebhookController = __decorate([
    (0, common_1.Controller)('webhooks/stripe'),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService,
        config_1.ConfigService])
], SubscriptionsWebhookController);
//# sourceMappingURL=subscriptions.webhook.controller.js.map