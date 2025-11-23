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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
const subscription_schema_1 = require("./schemas/subscription.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const veterinarians_service_1 = require("../veterinarians/veterinarians.service");
const pet_sitters_service_1 = require("../pet-sitters/pet-sitters.service");
let SubscriptionsService = class SubscriptionsService {
    constructor(subscriptionModel, userModel, configService, veterinariansService, petSittersService) {
        this.subscriptionModel = subscriptionModel;
        this.userModel = userModel;
        this.configService = configService;
        this.veterinariansService = veterinariansService;
        this.petSittersService = petSittersService;
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            console.warn('⚠️ STRIPE_SECRET_KEY not found. Stripe features will be disabled.');
        }
        else {
            this.stripe = new stripe_1.default(stripeSecretKey, {
                apiVersion: '2025-11-17.clover',
            });
        }
        this.subscriptionPriceId = this.configService.get('STRIPE_SUBSCRIPTION_PRICE_ID', 'price_test_monthly_30');
    }
    async create(userId, createSubscriptionDto) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingSubscription = await this.subscriptionModel.findOne({
            userId: user._id,
            status: {
                $in: [
                    subscription_schema_1.SubscriptionStatus.ACTIVE,
                    subscription_schema_1.SubscriptionStatus.EXPIRES_SOON,
                    subscription_schema_1.SubscriptionStatus.PENDING,
                ],
            },
        });
        if (existingSubscription) {
            throw new common_1.ConflictException('User already has an active or pending subscription');
        }
        const canceledOrExpiredSubscription = await this.subscriptionModel.findOne({
            userId: user._id,
            status: {
                $in: [subscription_schema_1.SubscriptionStatus.CANCELED, subscription_schema_1.SubscriptionStatus.EXPIRED],
            },
        });
        const isTestMode = this.configService.get('NODE_ENV') !== 'production' ||
            !this.stripe;
        let stripeSubscriptionId;
        let stripeCustomerId;
        let clientSecret;
        let currentPeriodStart;
        let currentPeriodEnd;
        if (isTestMode || !this.stripe) {
            currentPeriodStart = new Date();
            currentPeriodEnd = new Date();
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        }
        else {
            try {
                let customer;
                if (user.email) {
                    const existingCustomers = await this.stripe.customers.list({
                        email: user.email,
                        limit: 1,
                    });
                    if (existingCustomers.data.length > 0) {
                        customer = existingCustomers.data[0];
                    }
                    else {
                        customer = await this.stripe.customers.create({
                            email: user.email,
                            name: user.name,
                            metadata: {
                                userId: user._id.toString(),
                            },
                        });
                    }
                }
                else {
                    throw new common_1.BadRequestException('User email is required for subscription');
                }
                stripeCustomerId = customer.id;
                const subscription = await this.stripe.subscriptions.create({
                    customer: customer.id,
                    items: [{ price: this.subscriptionPriceId }],
                    payment_behavior: 'default_incomplete',
                    payment_settings: { save_default_payment_method: 'on_subscription' },
                    expand: ['latest_invoice.payment_intent'],
                });
                stripeSubscriptionId = subscription.id;
                const sub = subscription;
                if (sub.current_period_start) {
                    currentPeriodStart = new Date(sub.current_period_start * 1000);
                }
                if (sub.current_period_end) {
                    currentPeriodEnd = new Date(sub.current_period_end * 1000);
                }
                const invoice = sub.latest_invoice;
                if (invoice?.payment_intent) {
                    const paymentIntent = invoice.payment_intent;
                    clientSecret = paymentIntent.client_secret || undefined;
                }
            }
            catch (error) {
                console.error('Stripe subscription creation error:', error);
                throw new common_1.BadRequestException(`Failed to create Stripe subscription: ${error.message}`);
            }
        }
        let savedSubscription;
        if (canceledOrExpiredSubscription) {
            canceledOrExpiredSubscription.role = createSubscriptionDto.role;
            canceledOrExpiredSubscription.status = subscription_schema_1.SubscriptionStatus.PENDING;
            canceledOrExpiredSubscription.stripeSubscriptionId = stripeSubscriptionId;
            canceledOrExpiredSubscription.stripeCustomerId = stripeCustomerId;
            canceledOrExpiredSubscription.currentPeriodStart = currentPeriodStart;
            canceledOrExpiredSubscription.currentPeriodEnd = currentPeriodEnd;
            canceledOrExpiredSubscription.cancelAtPeriodEnd = false;
            savedSubscription = await canceledOrExpiredSubscription.save();
        }
        else {
            const subscription = new this.subscriptionModel({
                userId: user._id,
                role: createSubscriptionDto.role,
                status: subscription_schema_1.SubscriptionStatus.PENDING,
                stripeSubscriptionId,
                stripeCustomerId,
                currentPeriodStart,
                currentPeriodEnd,
                cancelAtPeriodEnd: false,
            });
            savedSubscription = await subscription.save();
        }
        return {
            subscription: this.mapToResponseDto(savedSubscription),
            clientSecret,
            message: 'Subscription created successfully. Please verify your email to activate.',
        };
    }
    async findByUserId(userId) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const subscription = await this.subscriptionModel.findOne({
            userId: userObjectId,
        });
        if (!subscription) {
            return null;
        }
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if ((subscription.status === subscription_schema_1.SubscriptionStatus.ACTIVE ||
            subscription.status === subscription_schema_1.SubscriptionStatus.EXPIRES_SOON) &&
            subscription.currentPeriodEnd &&
            new Date() > subscription.currentPeriodEnd) {
            subscription.status = subscription_schema_1.SubscriptionStatus.EXPIRED;
            await subscription.save();
            await this.userModel.findByIdAndUpdate(userId, { role: 'owner' });
        }
        else if (subscription.status === subscription_schema_1.SubscriptionStatus.ACTIVE &&
            subscription.currentPeriodEnd &&
            subscription.currentPeriodEnd <= sevenDaysFromNow &&
            subscription.currentPeriodEnd > now) {
            subscription.status = subscription_schema_1.SubscriptionStatus.EXPIRES_SOON;
            await subscription.save();
        }
        else if (subscription.status === subscription_schema_1.SubscriptionStatus.EXPIRES_SOON &&
            subscription.currentPeriodEnd &&
            subscription.currentPeriodEnd > sevenDaysFromNow) {
            subscription.status = subscription_schema_1.SubscriptionStatus.ACTIVE;
            await subscription.save();
        }
        return this.mapToResponseDto(subscription);
    }
    async activate(userId) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const subscription = await this.subscriptionModel.findOne({
            userId: userObjectId,
        });
        if (!subscription) {
            console.log(`⚠️ Cannot activate: No subscription found for userId: ${userId}`);
            throw new common_1.NotFoundException('Subscription not found');
        }
        if (subscription.status === subscription_schema_1.SubscriptionStatus.ACTIVE) {
            return this.mapToResponseDto(subscription);
        }
        subscription.status = subscription_schema_1.SubscriptionStatus.ACTIVE;
        await subscription.save();
        await this.userModel.findByIdAndUpdate(userId, { role: subscription.role });
        return this.mapToResponseDto(subscription);
    }
    async renew(userId) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const subscription = await this.subscriptionModel.findOne({
            userId: userObjectId,
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        if (subscription.status !== subscription_schema_1.SubscriptionStatus.ACTIVE &&
            subscription.status !== subscription_schema_1.SubscriptionStatus.EXPIRES_SOON) {
            throw new common_1.BadRequestException('Only active or expires soon subscriptions can be renewed');
        }
        const now = new Date();
        const newPeriodStart = subscription.currentPeriodEnd || now;
        const newPeriodEnd = new Date(newPeriodStart);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
        if (subscription.stripeSubscriptionId && this.stripe) {
            try {
            }
            catch (error) {
                console.error('Stripe renewal error:', error);
            }
        }
        subscription.currentPeriodStart = newPeriodStart;
        subscription.currentPeriodEnd = newPeriodEnd;
        subscription.cancelAtPeriodEnd = false;
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (newPeriodEnd <= sevenDaysFromNow) {
            subscription.status = subscription_schema_1.SubscriptionStatus.EXPIRES_SOON;
        }
        else {
            subscription.status = subscription_schema_1.SubscriptionStatus.ACTIVE;
        }
        await subscription.save();
        await this.userModel.findByIdAndUpdate(userId, { role: subscription.role });
        return this.mapToResponseDto(subscription);
    }
    async cancel(userId) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const subscription = await this.subscriptionModel.findOne({
            userId: userObjectId,
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        if (subscription.status !== subscription_schema_1.SubscriptionStatus.ACTIVE &&
            subscription.status !== subscription_schema_1.SubscriptionStatus.EXPIRES_SOON) {
            throw new common_1.BadRequestException('Only active or expires soon subscriptions can be canceled');
        }
        if (subscription.stripeSubscriptionId && this.stripe) {
            try {
                await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
            }
            catch (error) {
                console.error('Stripe cancellation error:', error);
            }
        }
        subscription.status = subscription_schema_1.SubscriptionStatus.CANCELED;
        subscription.cancelAtPeriodEnd = false;
        await subscription.save();
        await this.userModel.findByIdAndUpdate(userId, { role: 'owner' });
        try {
            if (subscription.role === 'vet') {
                await this.veterinariansService.remove(userId);
                console.log(`✅ Removed veterinarian record for user ${userId}`);
            }
            else if (subscription.role === 'sitter') {
                await this.petSittersService.remove(userId);
                console.log(`✅ Removed pet sitter record for user ${userId}`);
            }
        }
        catch (error) {
            console.warn(`⚠️ Could not remove ${subscription.role} record for user ${userId}:`, error);
        }
        return {
            subscription: this.mapToResponseDto(subscription),
            message: 'Subscription has been canceled. Your role has been downgraded to owner and your clinic/sitter profile has been removed.',
        };
    }
    async reactivate(userId) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const subscription = await this.subscriptionModel.findOne({
            userId: userObjectId,
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        if ((subscription.status === subscription_schema_1.SubscriptionStatus.ACTIVE ||
            subscription.status === subscription_schema_1.SubscriptionStatus.EXPIRES_SOON) &&
            !subscription.cancelAtPeriodEnd) {
            return this.mapToResponseDto(subscription);
        }
        if (subscription.status === subscription_schema_1.SubscriptionStatus.EXPIRED ||
            subscription.status === subscription_schema_1.SubscriptionStatus.CANCELED) {
            throw new common_1.BadRequestException('Cannot reactivate expired or canceled subscription. Please create a new subscription.');
        }
        if (subscription.stripeSubscriptionId && this.stripe) {
            try {
                await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                    cancel_at_period_end: false,
                });
            }
            catch (error) {
                console.error('Stripe reactivation error:', error);
            }
        }
        subscription.cancelAtPeriodEnd = false;
        await subscription.save();
        return this.mapToResponseDto(subscription);
    }
    async handleStripeWebhook(event) {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await this.updateSubscriptionFromStripe(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await this.handleSubscriptionDeleted(subscription);
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                if (invoice.subscription) {
                    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
                    await this.updateSubscriptionFromStripe(subscription);
                }
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                if (invoice.subscription) {
                    console.warn(`Payment failed for subscription: ${invoice.subscription}`);
                }
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    }
    async updateSubscriptionFromStripe(stripeSubscription) {
        const subscription = await this.subscriptionModel.findOne({
            stripeSubscriptionId: stripeSubscription.id,
        });
        if (!subscription) {
            console.warn(`Subscription not found for Stripe ID: ${stripeSubscription.id}`);
            return;
        }
        const sub = stripeSubscription;
        if (sub.current_period_start) {
            subscription.currentPeriodStart = new Date(sub.current_period_start * 1000);
        }
        if (sub.current_period_end) {
            subscription.currentPeriodEnd = new Date(sub.current_period_end * 1000);
        }
        subscription.cancelAtPeriodEnd = sub.cancel_at_period_end || false;
        switch (stripeSubscription.status) {
            case 'active':
                subscription.status = subscription_schema_1.SubscriptionStatus.ACTIVE;
                await this.userModel.findByIdAndUpdate(subscription.userId, {
                    role: subscription.role,
                });
                break;
            case 'canceled':
            case 'unpaid':
            case 'past_due':
                subscription.status = subscription_schema_1.SubscriptionStatus.EXPIRED;
                await this.userModel.findByIdAndUpdate(subscription.userId, {
                    role: 'owner',
                });
                break;
        }
        await subscription.save();
    }
    async handleSubscriptionDeleted(stripeSubscription) {
        const subscription = await this.subscriptionModel.findOne({
            stripeSubscriptionId: stripeSubscription.id,
        });
        if (!subscription) {
            return;
        }
        subscription.status = subscription_schema_1.SubscriptionStatus.EXPIRED;
        await subscription.save();
        await this.userModel.findByIdAndUpdate(subscription.userId, {
            role: 'owner',
        });
    }
    async checkAndExpireSubscriptions() {
        const now = new Date();
        const expiredSubscriptions = await this.subscriptionModel.find({
            status: {
                $in: [subscription_schema_1.SubscriptionStatus.ACTIVE, subscription_schema_1.SubscriptionStatus.EXPIRES_SOON],
            },
            currentPeriodEnd: { $lt: now },
        });
        for (const subscription of expiredSubscriptions) {
            subscription.status = subscription_schema_1.SubscriptionStatus.EXPIRED;
            await subscription.save();
            await this.userModel.findByIdAndUpdate(subscription.userId, {
                role: 'owner',
            });
        }
    }
    async checkAndCancelExpiredSubscriptions() {
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const expiredSubscriptions = await this.subscriptionModel.find({
            status: subscription_schema_1.SubscriptionStatus.EXPIRED,
            currentPeriodEnd: { $lt: threeDaysAgo },
        });
        for (const subscription of expiredSubscriptions) {
            subscription.status = subscription_schema_1.SubscriptionStatus.CANCELED;
            await subscription.save();
            try {
                if (subscription.role === 'vet') {
                    await this.veterinariansService.remove(subscription.userId.toString());
                    console.log(`✅ Auto-canceled: Removed veterinarian record for user ${subscription.userId}`);
                }
                else if (subscription.role === 'sitter') {
                    await this.petSittersService.remove(subscription.userId.toString());
                    console.log(`✅ Auto-canceled: Removed pet sitter record for user ${subscription.userId}`);
                }
            }
            catch (error) {
                console.warn(`⚠️ Auto-cancel: Could not remove ${subscription.role} record for user ${subscription.userId}:`, error);
            }
            console.log(`✅ Auto-canceled subscription for userId: ${subscription.userId} (expired for more than 3 days)`);
        }
        if (expiredSubscriptions.length > 0) {
            console.log(`✅ Auto-canceled ${expiredSubscriptions.length} subscription(s) that were expired for more than 3 days`);
        }
    }
    mapToResponseDto(subscription) {
        return {
            id: subscription._id.toString(),
            userId: subscription.userId.toString(),
            role: subscription.role,
            status: subscription.status,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            stripeCustomerId: subscription.stripeCustomerId,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
        };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(subscription_schema_1.Subscription.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService,
        veterinarians_service_1.VeterinariansService,
        pet_sitters_service_1.PetSittersService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map