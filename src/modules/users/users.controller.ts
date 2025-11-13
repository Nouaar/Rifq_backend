// src/modules/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Create user (owner by default)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  // Get all users
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // Get a single user by ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  // Update user
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    if (!updatedUser)
      throw new NotFoundException(`User with ID ${id} not found`);
    return updatedUser;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Body() payload: UpdateProfileDto,
  ): Promise<User> {
    const phoneNumber = payload.phoneNumber ?? payload.phone;
    return this.usersService.updateProfile(user._id.toString(), {
      name: payload.name,
      phoneNumber,
      country: payload.country,
      city: payload.city,
      hasPhoto: payload.hasPhoto,
      hasPets: payload.hasPets,
    });
  }

  // Delete user
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const deleted = await this.usersService.remove(id);
    if (!deleted) throw new NotFoundException(`User with ID ${id} not found`);
  }
}
