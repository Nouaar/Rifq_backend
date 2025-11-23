// src/modules/subscriptions/subscriptions.scheduler.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionsScheduler {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // Run every hour to check for expired subscriptions
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredSubscriptions() {
    try {
      await this.subscriptionsService.checkAndExpireSubscriptions();
      console.log('Subscription expiration check completed');
    } catch (error) {
      console.error('Error checking expired subscriptions:', error);
    }
  }

  // Run every hour to check for expired subscriptions that should be auto-canceled (after 3 days)
  @Cron(CronExpression.EVERY_HOUR)
  async checkAndCancelExpiredSubscriptions() {
    try {
      await this.subscriptionsService.checkAndCancelExpiredSubscriptions();
    } catch (error) {
      console.error('Error auto-canceling expired subscriptions:', error);
    }
  }
}
