// src/modules/veterinarians/veterinarians.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateVetDto } from './dto/create-vet.dto';
import { UpdateVetDto } from './dto/update-vet.dto';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Veterinarian,
  VeterinarianDocument,
} from './schemas/veterinarian.schema';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VeterinariansService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Veterinarian.name)
    private readonly veterinarianModel: Model<VeterinarianDocument>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async create(createVetDto: CreateVetDto): Promise<UserDocument> {
    // Check if user with email already exists
    const existingUser = await this.usersService.findByEmail(
      createVetDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createVetDto.password, 10);

    // Create vet user with role 'vet'
    const vetData = {
      ...createVetDto,
      password: hashedPassword,
      role: 'vet',
      isVerified: false,
      balance: 0,
    };

    const createdUser = await new this.userModel(vetData).save();

    // Create veterinarian record in veterinarians collection
    const veterinarian = new this.veterinarianModel({
      user: createdUser._id,
      licenseNumber: createVetDto.licenseNumber,
      clinicName: createVetDto.clinicName,
      clinicAddress: createVetDto.clinicAddress,
      specializations: createVetDto.specializations || [],
      yearsOfExperience: createVetDto.yearsOfExperience,
      latitude: createVetDto.latitude,
      longitude: createVetDto.longitude,
      bio: createVetDto.bio,
    });

    await veterinarian.save();

    return createdUser;
  }

  async findAll(): Promise<UserDocument[]> {
    const veterinarians = await this.veterinarianModel
      .find()
      .populate('user')
      .exec();
    return veterinarians.map((vet) => {
      const user = vet.user as unknown as UserDocument;
      if (!user || !('_id' in user)) {
        throw new NotFoundException('User not populated correctly');
      }
      // Merge all veterinarian-specific fields into User document
      if (vet.latitude !== undefined) {
        (user as any).latitude = vet.latitude;
      }
      if (vet.longitude !== undefined) {
        (user as any).longitude = vet.longitude;
      }
      if (vet.licenseNumber !== undefined) {
        (user as any).licenseNumber = vet.licenseNumber;
      }
      if (vet.clinicName !== undefined) {
        (user as any).clinicName = vet.clinicName;
      }
      if (vet.clinicAddress !== undefined) {
        (user as any).clinicAddress = vet.clinicAddress;
      }
      if (vet.specializations !== undefined) {
        (user as any).specializations = vet.specializations;
      }
      if (vet.yearsOfExperience !== undefined) {
        (user as any).yearsOfExperience = vet.yearsOfExperience;
      }
      if (vet.bio !== undefined) {
        (user as any).bio = vet.bio;
      }
      return user;
    });
  }

  async findOne(id: string): Promise<UserDocument> {
    const vet = await this.veterinarianModel
      .findOne({ user: id })
      .populate('user')
      .exec();
    if (!vet) {
      throw new NotFoundException(`Veterinarian with ID ${id} not found`);
    }
    const user = vet.user as unknown as UserDocument;
    if (!user || !('_id' in user)) {
      throw new NotFoundException('User not populated correctly');
    }
    // Merge all veterinarian-specific fields into User document
    if (vet.latitude !== undefined) {
      (user as any).latitude = vet.latitude;
    }
    if (vet.longitude !== undefined) {
      (user as any).longitude = vet.longitude;
    }
    if (vet.licenseNumber !== undefined) {
      (user as any).licenseNumber = vet.licenseNumber;
    }
    if (vet.clinicName !== undefined) {
      (user as any).clinicName = vet.clinicName;
    }
    if (vet.clinicAddress !== undefined) {
      (user as any).clinicAddress = vet.clinicAddress;
    }
    if (vet.specializations !== undefined) {
      (user as any).specializations = vet.specializations;
    }
    if (vet.yearsOfExperience !== undefined) {
      (user as any).yearsOfExperience = vet.yearsOfExperience;
    }
    if (vet.bio !== undefined) {
      (user as any).bio = vet.bio;
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.role !== 'vet') {
      return null;
    }
    const vet = await this.veterinarianModel
      .findOne({ user: user._id })
      .populate('user')
      .exec();
    if (!vet) {
      return null;
    }
    const populatedUser = vet.user as unknown as UserDocument;
    return populatedUser && '_id' in populatedUser ? populatedUser : null;
  }

  async update(id: string, updateVetDto: UpdateVetDto): Promise<UserDocument> {
    // Update user fields if provided
    if (updateVetDto.name || updateVetDto.email || updateVetDto.phoneNumber) {
      const userUpdate: any = {};
      if (updateVetDto.name) userUpdate.name = updateVetDto.name;
      if (updateVetDto.email) userUpdate.email = updateVetDto.email;
      if (updateVetDto.phoneNumber !== undefined) userUpdate.phoneNumber = updateVetDto.phoneNumber;
      await this.userModel.findByIdAndUpdate(id, { $set: userUpdate }).exec();
    }

    // Prepare vet-specific update data (exclude user fields)
    const vetUpdateData: any = { ...updateVetDto };
    delete vetUpdateData.name;
    delete vetUpdateData.email;
    delete vetUpdateData.phoneNumber;

    const vet = await this.veterinarianModel
      .findOneAndUpdate({ user: id }, { $set: vetUpdateData }, { new: true })
      .populate('user')
      .exec();

    if (!vet) {
      throw new NotFoundException(`Veterinarian with ID ${id} not found`);
    }
    const user = vet.user as unknown as UserDocument;
    if (!user || !('_id' in user)) {
      throw new NotFoundException('User not populated correctly');
    }
    // Merge all veterinarian-specific fields into User document
    if (vet.latitude !== undefined) {
      (user as any).latitude = vet.latitude;
    }
    if (vet.longitude !== undefined) {
      (user as any).longitude = vet.longitude;
    }
    if (vet.licenseNumber !== undefined) {
      (user as any).licenseNumber = vet.licenseNumber;
    }
    if (vet.clinicName !== undefined) {
      (user as any).clinicName = vet.clinicName;
    }
    if (vet.clinicAddress !== undefined) {
      (user as any).clinicAddress = vet.clinicAddress;
    }
    if (vet.specializations !== undefined) {
      (user as any).specializations = vet.specializations;
    }
    if (vet.yearsOfExperience !== undefined) {
      (user as any).yearsOfExperience = vet.yearsOfExperience;
    }
    if (vet.bio !== undefined) {
      (user as any).bio = vet.bio;
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.veterinarianModel
      .findOneAndDelete({ user: id })
      .exec();

    if (!result) {
      throw new NotFoundException(`Veterinarian with ID ${id} not found`);
    }

    // Also update user role back to 'owner'
    await this.userModel
      .findByIdAndUpdate(id, { $set: { role: 'owner' } })
      .exec();
  }

  // Convert existing user to vet (when they complete the join form)
  async convertUserToVet(
    userId: string,
    vetData: Omit<CreateVetDto, 'email' | 'name' | 'password'>,
  ): Promise<UserDocument> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if veterinarian record already exists
    let veterinarian = await this.veterinarianModel
      .findOne({ user: userId })
      .exec();

    if (veterinarian) {
      // Already a vet, just update the fields
      veterinarian = await this.veterinarianModel
        .findOneAndUpdate(
          { user: userId },
          {
            $set: {
              licenseNumber: vetData.licenseNumber,
              clinicName: vetData.clinicName,
              clinicAddress: vetData.clinicAddress,
              specializations: vetData.specializations || [],
              yearsOfExperience: vetData.yearsOfExperience,
              latitude: vetData.latitude,
              longitude: vetData.longitude,
              bio: vetData.bio,
            },
          },
          { new: true },
        )
        .populate('user')
        .exec();
    } else {
      // Create new veterinarian record in veterinarians collection
      // Explicitly exclude email field to prevent any issues
      const vetRecordData: any = {
        user: userId,
        licenseNumber: vetData.licenseNumber,
        clinicName: vetData.clinicName,
        clinicAddress: vetData.clinicAddress,
        specializations: vetData.specializations || [],
        yearsOfExperience: vetData.yearsOfExperience,
        latitude: vetData.latitude,
        longitude: vetData.longitude,
        bio: vetData.bio,
      };

      // Ensure email is not included
      delete vetRecordData.email;

      const vetRecord = new this.veterinarianModel(vetRecordData);

      veterinarian = await vetRecord.save();
      await veterinarian.populate('user');

      // Update user role to 'vet' and always generate/send verification code
      const user = await this.usersService.findOne(userId);

      // Always generate a new verification code and send email when converting to vet
      // This ensures the user verifies their email after role change
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

      await this.userModel
        .findByIdAndUpdate(userId, {
          $set: {
            role: 'vet',
            isVerified: false, // Require re-verification after role change
            verificationCode,
            verificationCodeExpires,
          },
        })
        .exec();

      // Send verification email (best effort - don't block conversion)
      console.log(
        `[Vet Conversion] Sending verification email to ${user.email} with code: ${verificationCode}`,
      );
      try {
        await this.mailService.sendVerificationCode(
          user.email,
          verificationCode,
        );
        console.log(
          `[Vet Conversion] Verification email sent successfully to ${user.email}`,
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(
            'Failed to send verification email during vet conversion:',
            err.message,
          );
          console.error('Error stack:', err.stack);
        } else {
          console.error(
            'Failed to send verification email during vet conversion (unknown error):',
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
