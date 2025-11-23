import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsScheduler {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    checkExpiredSubscriptions(): Promise<void>;
    checkAndCancelExpiredSubscriptions(): Promise<void>;
}
