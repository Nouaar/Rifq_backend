// src/modules/pet-sitters/pet-sitters.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PetSittersService } from './pet-sitters.service';
import { PetSittersController } from './pet-sitters.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PetSitter, PetSitterSchema } from './schemas/pet-sitter.schema';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PetSitter.name, schema: PetSitterSchema },
    ]),
    UsersModule,
    MailModule,
  ],
  controllers: [PetSittersController],
  providers: [PetSittersService],
  exports: [PetSittersService],
})
export class PetSittersModule {}

