// src/modules/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { Pet, PetSchema } from '../pets/schemas/pet.schema';
import {
  MedicalHistory,
  MedicalHistorySchema,
} from '../pets/schemas/medical-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pet.name, schema: PetSchema },
      { name: MedicalHistory.name, schema: MedicalHistorySchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, GeminiService],
  exports: [AiService],
})
export class AiModule {}
