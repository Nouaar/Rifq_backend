import { RawBodyRequest } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponseDto, CreateSubscriptionResponseDto, CancelSubscriptionResponseDto, VerifyEmailResponseDto } from './dto/subscription-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    private readonly configService;
    private readonly stripeWebhookSecret;
    constructor(subscriptionsService: SubscriptionsService, configService: ConfigService);
    create(user: UserDocument, createSubscriptionDto: CreateSubscriptionDto): Promise<CreateSubscriptionResponseDto>;
    getMySubscription(user: UserDocument): Promise<SubscriptionResponseDto>;
    cancel(user: UserDocument): Promise<CancelSubscriptionResponseDto>;
    reactivate(user: UserDocument): Promise<SubscriptionResponseDto>;
    renew(user: UserDocument): Promise<SubscriptionResponseDto>;
    verifyEmail(user: UserDocument, verifyEmailDto: VerifyEmailDto): Promise<VerifyEmailResponseDto>;
    resendVerification(user: UserDocument): Promise<{
        message: string;
    }>;
    handleWebhook(req: RawBodyRequest<Request>): Promise<{
        received: boolean;
    }>;
}
