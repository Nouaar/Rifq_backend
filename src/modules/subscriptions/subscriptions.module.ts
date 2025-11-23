// src/modules/subscriptions/subscriptions.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsScheduler } from './subscriptions.scheduler';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { VeterinariansModule } from '../veterinarians/veterinarians.module';
import { PetSittersModule } from '../pet-sitters/pet-sitters.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScheduleModule.forRoot(),
    UsersModule,
    VeterinariansModule,
    PetSittersModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsScheduler],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

