// src/modules/messages/messages.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message, MessageSchema } from './schemas/message.schema';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FcmModule } from '../fcm/fcm.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    FcmModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, CloudinaryService],
  exports: [MessagesService],
})
export class MessagesModule {}
