import { SubscriptionStatus } from '../schemas/subscription.schema';
export declare class SubscriptionResponseDto {
    id: string;
    userId: string;
    role: string;
    status: SubscriptionStatus;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class CreateSubscriptionResponseDto {
    subscription: SubscriptionResponseDto;
    clientSecret?: string;
    message?: string;
}
export declare class CancelSubscriptionResponseDto {
    subscription: SubscriptionResponseDto;
    message?: string;
}
export declare class VerifyEmailResponseDto {
    success: boolean;
    message?: string;
    subscription?: SubscriptionResponseDto;
}
