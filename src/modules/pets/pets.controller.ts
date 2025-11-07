// src/modules/pets/pets.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Delete,
  Put,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post('owner/:ownerId')
  async create(
    @Param('ownerId') ownerId: string,
    @Body() createPetDto: CreatePetDto,
  ) {
    return this.petsService.create(ownerId, createPetDto);
  }

  @Get('owner/:ownerId')
  async findAllByOwner(@Param('ownerId') ownerId: string) {
    return this.petsService.findAllByOwner(ownerId);
  }

  @Get(':petId')
  async findOne(@Param('petId') petId: string) {
    return this.petsService.findOne(petId);
  }

  @Put(':petId')
  async update(
    @Param('petId') petId: string,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    return this.petsService.update(petId, updatePetDto);
  }

  @Delete(':ownerId/:petId')
  async delete(
    @Param('ownerId') ownerId: string,
    @Param('petId') petId: string,
  ) {
    return this.petsService.delete(petId, ownerId);
  }
}
