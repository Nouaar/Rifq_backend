// src/modules/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const createdUser = new this.userModel({
      ...createUserDto,
      balance: createUserDto.balance ?? 0,
      isVerified: createUserDto.isVerified ?? false,
    });
    return createdUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { hashedRefreshToken: refreshToken },
        { new: true },
      )
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    update: Partial<{
      name?: string;
      phoneNumber?: string;
      country?: string;
      city?: string;
      hasPhoto?: boolean;
      hasPets?: boolean;
    }>
  ): Promise<UserDocument> {
    const payload: Record<string, unknown> = {};

    if (update.name !== undefined) payload.name = update.name;
    if (update.phoneNumber !== undefined) payload.phoneNumber = update.phoneNumber;
    if (update.country !== undefined) payload.country = update.country;
    if (update.city !== undefined) payload.city = update.city;
    if (update.hasPhoto !== undefined) payload.hasPhoto = update.hasPhoto;
    if (update.hasPets !== undefined) payload.hasPets = update.hasPets;

    const user = await this.userModel
      .findByIdAndUpdate(userId, payload, { new: true })
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
