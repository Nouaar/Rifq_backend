import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsWebhookController {
    private readonly subscriptionsService;
    private readonly configService;
    private stripe;
    private webhookSecret;
    constructor(subscriptionsService: SubscriptionsService, configService: ConfigService);
    handleWebhook(request: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
    private handlePaymentIntentSucceeded;
    private handlePaymentIntentFailed;
    private handleSubscriptionUpdated;
    private handleSubscriptionDeleted;
}
