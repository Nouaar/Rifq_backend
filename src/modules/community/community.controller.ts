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
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      console.log('Create post request received');
      console.log('User:', req.user);
      console.log('Body:', body);
      console.log('File:', file ? 'File present' : 'No file');

      if (!file) {
        throw new BadRequestException('Pet image is required');
      }

      // Upload image to Cloudinary
      console.log('Uploading to Cloudinary...');
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'community',
      );
      console.log('Cloudinary upload successful:', uploadResult.secure_url);

      const createPostDto: CreatePostDto = {
        petImage: uploadResult.secure_url,
        caption: body.caption || null,
      };

      console.log('Creating post in database...');
      const post = await this.communityService.createPost(
        req.user._id.toString(),
        req.user.name,
        req.user.profileImage,
        createPostDto,
      );
      console.log('Post created successfully');

      return {
        message: 'Post created successfully',
        post,
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  @Get('posts')
  async getPosts(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.communityService.getPosts(
      pageNum,
      limitNum,
      req.user._id.toString(),
    );
  }

  @Get('my-posts')
  async getMyPosts(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.communityService.getMyPosts(
      pageNum,
      limitNum,
      req.user._id.toString(),
    );
  }

  @Post('posts/:postId/react')
  async reactToPost(
    @Request() req,
    @Param('postId') postId: string,
    @Body() reactPostDto: ReactPostDto,
  ) {
    const post = await this.communityService.reactToPost(
      postId,
      req.user._id.toString(),
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
      req.user._id.toString(),
      reactionType,
    );

    return {
      message: 'Reaction removed successfully',
      post,
    };
  }

  @Delete('posts/:postId')
  async deletePost(@Request() req, @Param('postId') postId: string) {
    await this.communityService.deletePost(postId, req.user._id.toString());

    return {
      message: 'Post deleted successfully',
    };
  }
}
