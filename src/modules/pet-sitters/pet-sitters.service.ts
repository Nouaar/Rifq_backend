// src/modules/pet-sitters/pet-sitters.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSitterDto } from './dto/create-sitter.dto';
import { UpdateSitterDto } from './dto/update-sitter.dto';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PetSitter, PetSitterDocument } from './schemas/pet-sitter.schema';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PetSittersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PetSitter.name)
    private readonly petSitterModel: Model<PetSitterDocument>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async create(createSitterDto: CreateSitterDto): Promise<UserDocument> {
    // Check if user with email already exists
    const existingUser = await this.usersService.findByEmail(
      createSitterDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createSitterDto.password, 10);

    // Create sitter user with role 'sitter'
    const sitterData = {
      ...createSitterDto,
      password: hashedPassword,
      role: 'sitter',
      isVerified: false,
      balance: 0,
    };

    const createdUser = await new this.userModel(sitterData).save();

    // Convert availability strings to Date objects if provided
    let availabilityDates: Date[] | undefined;
    if (
      createSitterDto.availability &&
      Array.isArray(createSitterDto.availability)
    ) {
      availabilityDates = createSitterDto.availability.map((date: any) => {
        if (typeof date === 'string') {
          return new Date(date);
        }
        return date instanceof Date ? date : new Date(date);
      });
    }

    // Create pet sitter record in pet-sitters collection
    const petSitter = new this.petSitterModel({
      user: createdUser._id,
      hourlyRate: createSitterDto.hourlyRate,
      sitterAddress: createSitterDto.sitterAddress,
      services: createSitterDto.services || [],
      yearsOfExperience: createSitterDto.yearsOfExperience,
      availableWeekends: createSitterDto.availableWeekends ?? false,
      canHostPets: createSitterDto.canHostPets ?? false,
      availability: availabilityDates || [],
      latitude: createSitterDto.latitude,
      longitude: createSitterDto.longitude,
      bio: createSitterDto.bio,
    });

    await petSitter.save();

    return createdUser;
  }

  async findAll(): Promise<UserDocument[]> {
    const sitters = await this.petSitterModel.find().populate('user').exec();
    return sitters.map((sitter) => {
      const user = sitter.user as unknown as UserDocument;
      if (!user || !('_id' in user)) {
        throw new NotFoundException('User not populated correctly');
      }
      // Merge all sitter-specific fields into User document
      if (sitter.latitude !== undefined) {
        (user as any).latitude = sitter.latitude;
      }
      if (sitter.longitude !== undefined) {
        (user as any).longitude = sitter.longitude;
      }
      if (sitter.hourlyRate !== undefined) {
        (user as any).hourlyRate = sitter.hourlyRate;
      }
      if (sitter.sitterAddress !== undefined) {
        (user as any).sitterAddress = sitter.sitterAddress;
      }
      if (sitter.services !== undefined) {
        (user as any).services = sitter.services;
      }
      if (sitter.yearsOfExperience !== undefined) {
        (user as any).yearsOfExperience = sitter.yearsOfExperience;
      }
      if (sitter.availableWeekends !== undefined) {
        (user as any).availableWeekends = sitter.availableWeekends;
      }
      if (sitter.canHostPets !== undefined) {
        (user as any).canHostPets = sitter.canHostPets;
      }
      if (sitter.availability !== undefined) {
        (user as any).availability = sitter.availability;
      }
      if (sitter.bio !== undefined) {
        (user as any).bio = sitter.bio;
      }
      return user;
    });
  }

  async findOne(id: string): Promise<UserDocument> {
    const sitter = await this.petSitterModel
      .findOne({ user: id })
      .populate('user')
      .exec();
    if (!sitter) {
      throw new NotFoundException(`Pet sitter with ID ${id} not found`);
    }
    const user = sitter.user as unknown as UserDocument;
    if (!user || !('_id' in user)) {
      throw new NotFoundException('User not populated correctly');
    }
    // Merge all sitter-specific fields into User document
    if (sitter.latitude !== undefined) {
      (user as any).latitude = sitter.latitude;
    }
    if (sitter.longitude !== undefined) {
      (user as any).longitude = sitter.longitude;
    }
    if (sitter.hourlyRate !== undefined) {
      (user as any).hourlyRate = sitter.hourlyRate;
    }
    if (sitter.sitterAddress !== undefined) {
      (user as any).sitterAddress = sitter.sitterAddress;
    }
    if (sitter.services !== undefined) {
      (user as any).services = sitter.services;
    }
    if (sitter.yearsOfExperience !== undefined) {
      (user as any).yearsOfExperience = sitter.yearsOfExperience;
    }
    if (sitter.availableWeekends !== undefined) {
      (user as any).availableWeekends = sitter.availableWeekends;
    }
    if (sitter.canHostPets !== undefined) {
      (user as any).canHostPets = sitter.canHostPets;
    }
    if (sitter.availability !== undefined) {
      (user as any).availability = sitter.availability;
    }
    if (sitter.bio !== undefined) {
      (user as any).bio = sitter.bio;
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.role !== 'sitter') {
      return null;
    }
    const sitter = await this.petSitterModel
      .findOne({ user: user._id })
      .populate('user')
      .exec();
    if (!sitter) {
      return null;
    }
    const populatedUser = sitter.user as unknown as UserDocument;
    return populatedUser && '_id' in populatedUser ? populatedUser : null;
  }

  async update(
    id: string,
    updateSitterDto: UpdateSitterDto,
  ): Promise<UserDocument> {
    // Update user fields if provided
    if (updateSitterDto.name || updateSitterDto.email || updateSitterDto.phoneNumber) {
      const userUpdate: any = {};
      if (updateSitterDto.name) userUpdate.name = updateSitterDto.name;
      if (updateSitterDto.email) userUpdate.email = updateSitterDto.email;
      if (updateSitterDto.phoneNumber !== undefined) userUpdate.phoneNumber = updateSitterDto.phoneNumber;
      await this.userModel.findByIdAndUpdate(id, { $set: userUpdate }).exec();
    }

    // Prepare sitter-specific update data (exclude user fields)
    const updateData: any = { ...updateSitterDto };
    delete updateData.name;
    delete updateData.email;
    delete updateData.phoneNumber;

    // Convert availability strings to Date objects if provided
    if (
      updateData.availability &&
      Array.isArray(updateData.availability)
    ) {
      updateData.availability = updateData.availability.map(
        (date: any) => {
          if (typeof date === 'string') {
            return new Date(date);
          }
          return date instanceof Date ? date : new Date(date);
        },
      );
    }

    const sitter = await this.petSitterModel
      .findOneAndUpdate({ user: id }, { $set: updateData }, { new: true })
      .populate('user')
      .exec();

    if (!sitter) {
      throw new NotFoundException(`Pet sitter with ID ${id} not found`);
    }
    const user = sitter.user as unknown as UserDocument;
    if (!user || !('_id' in user)) {
      throw new NotFoundException('User not populated correctly');
    }
    // Merge all sitter-specific fields into User document
    if (sitter.latitude !== undefined) {
      (user as any).latitude = sitter.latitude;
    }
    if (sitter.longitude !== undefined) {
      (user as any).longitude = sitter.longitude;
    }
    if (sitter.hourlyRate !== undefined) {
      (user as any).hourlyRate = sitter.hourlyRate;
    }
    if (sitter.sitterAddress !== undefined) {
      (user as any).sitterAddress = sitter.sitterAddress;
    }
    if (sitter.services !== undefined) {
      (user as any).services = sitter.services;
    }
    if (sitter.yearsOfExperience !== undefined) {
      (user as any).yearsOfExperience = sitter.yearsOfExperience;
    }
    if (sitter.availableWeekends !== undefined) {
      (user as any).availableWeekends = sitter.availableWeekends;
    }
    if (sitter.canHostPets !== undefined) {
      (user as any).canHostPets = sitter.canHostPets;
    }
    if (sitter.availability !== undefined) {
      (user as any).availability = sitter.availability;
    }
    if (sitter.bio !== undefined) {
      (user as any).bio = sitter.bio;
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.petSitterModel
      .findOneAndDelete({ user: id })
      .exec();

    if (!result) {
      throw new NotFoundException(`Pet sitter with ID ${id} not found`);
    }

    // Also update user role back to 'owner'
    await this.userModel
      .findByIdAndUpdate(id, { $set: { role: 'owner' } })
      .exec();
  }

  // Convert existing user to pet sitter (when they complete the join form)
  async convertUserToSitter(
    userId: string,
    sitterData: Omit<CreateSitterDto, 'email' | 'name' | 'password'>,
  ): Promise<UserDocument> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Convert availability strings to Date objects if provided
    let availabilityDates: Date[] | undefined;
    if (sitterData.availability && Array.isArray(sitterData.availability)) {
      availabilityDates = sitterData.availability.map((date: any) => {
        if (typeof date === 'string') {
          return new Date(date);
        }
        return date instanceof Date ? date : new Date(date);
      });
    }

    // Check if pet sitter record already exists
    let petSitter = await this.petSitterModel.findOne({ user: userId }).exec();

    if (petSitter) {
      // Already a sitter, just update the fields
      // Convert to UpdateSitterDto format
      const updateData: UpdateSitterDto = {
        hourlyRate: sitterData.hourlyRate,
        sitterAddress: sitterData.sitterAddress,
        services: sitterData.services,
        yearsOfExperience: sitterData.yearsOfExperience,
        availableWeekends: sitterData.availableWeekends,
        canHostPets: sitterData.canHostPets,
        availability: availabilityDates,
        latitude: sitterData.latitude,
        longitude: sitterData.longitude,
        bio: sitterData.bio,
      };
      return this.update(userId, updateData);
    } else {
      // Create new pet sitter record in pet-sitters collection
      const sitterRecord = new this.petSitterModel({
        user: userId,
        hourlyRate: sitterData.hourlyRate,
        sitterAddress: sitterData.sitterAddress,
        services: sitterData.services || [],
        yearsOfExperience: sitterData.yearsOfExperience,
        availableWeekends: sitterData.availableWeekends ?? false,
        canHostPets: sitterData.canHostPets ?? false,
        availability: availabilityDates || [],
        latitude: sitterData.latitude,
        longitude: sitterData.longitude,
        bio: sitterData.bio,
      });

      petSitter = await sitterRecord.save();
      await petSitter.populate('user');

      // Update user role to 'sitter' and always generate/send verification code
      const user = await this.usersService.findOne(userId);

      // Always generate a new verification code and send email when converting to sitter
      // This ensures the user verifies their email after role change
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

      await this.userModel
        .findByIdAndUpdate(userId, {
          $set: {
            role: 'sitter',
            isVerified: false, // Require re-verification after role change
            verificationCode,
            verificationCodeExpires,
          },
        })
        .exec();

      // Send verification email (best effort - don't block conversion)
      console.log(
        `[Sitter Conversion] Sending verification email to ${user.email} with code: ${verificationCode}`,
      );
      try {
        await this.mailService.sendVerificationCode(
          user.email,
          verificationCode,
        );
        console.log(
          `[Sitter Conversion] Verification email sent successfully to ${user.email}`,
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(
            'Failed to send verification email during sitter conversion:',
            err.message,
          );
          console.error('Error stack:', err.stack);
        } else {
          console.error(
            'Failed to send verification email during sitter conversion (unknown error):',
            err,
          );
        }
      }
    }

    // Return the user with updated role
    const updatedUser = await this.usersService.findOne(userId);
    return updatedUser;
  }
}
