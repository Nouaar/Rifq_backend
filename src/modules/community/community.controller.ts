// src/modules/community/community.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ReactPostDto } from './dto/react-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('posts')
  @UseInterceptors(FileInterceptor('petImage'))
  async createPost(
    @Request() req,
    @Body('caption') caption: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Pet image is required');
    }

    // Upload image to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'community',
    );

    const createPostDto: CreatePostDto = {
      petImage: uploadResult.secure_url,
      caption,
    };

    const post = await this.communityService.createPost(
      req.user.userId,
      req.user.name,
      req.user.profileImage,
      createPostDto,
    );

    return {
      message: 'Post created successfully',
      post,
    };
  }

  @Get('posts')
  async getPosts(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.communityService.getPosts(pageNum, limitNum, req.user.userId);
  }

  @Post('posts/:postId/react')
  async reactToPost(
    @Request() req,
    @Param('postId') postId: string,
    @Body() reactPostDto: ReactPostDto,
  ) {
    const post = await this.communityService.reactToPost(
      postId,
      req.user.userId,
      reactPostDto,
    );

    return {
      message: 'Reaction added successfully',
      post,
    };
  }

  @Delete('posts/:postId/react')
  async removeReaction(
    @Request() req,
    @Param('postId') postId: string,
    @Query('reactionType') reactionType: string,
  ) {
    const post = await this.communityService.removeReaction(
      postId,
      req.user.userId,
      reactionType,
    );

    return {
      message: 'Reaction removed successfully',
      post,
    };
  }

  @Delete('posts/:postId')
  async deletePost(@Request() req, @Param('postId') postId: string) {
    await this.communityService.deletePost(postId, req.user.userId);

    return {
      message: 'Post deleted successfully',
    };
  }
}
