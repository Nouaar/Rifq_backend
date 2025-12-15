// src/modules/community/community.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { ReactPostDto } from './dto/react-post.dto';

@Injectable()
export class CommunityService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async createPost(
    userId: string,
    userName: string,
    userProfileImage: string,
    userRole: string,
    createPostDto: CreatePostDto,
  ): Promise<Post> {
    const newPost = new this.postModel({
      userId,
      userName,
      userProfileImage,
      userRole,
      petImage: createPostDto.petImage,
      caption: createPostDto.caption,
      reactions: new Map([
        ['like', 0],
        ['love', 0],
        ['haha', 0],
        ['angry', 0],
        ['cry', 0],
      ]),
      userReactions: [],
    });

    return newPost.save();
  }

  async getMyPosts(
    page: number = 1,
    limit: number = 10,
    userId: string,
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.postModel.countDocuments({ userId }).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Transform posts to include user's reaction
    const transformedPosts = posts.map((post) => {
      const userReaction = post.userReactions?.find(
        (r: any) => r.userId === userId,
      );

      // Convert MongoDB Map to JavaScript Map
      const reactions = post.reactions instanceof Map 
        ? post.reactions 
        : new Map(Object.entries(post.reactions || {}));

      return {
        _id: post._id,
        userId: post.userId,
        userName: post.userName,
        userProfileImage: post.userProfileImage,
        userRole: post.userRole,
        petImage: post.petImage,
        caption: post.caption,
        likes: reactions?.get('like') || 0,
        loves: reactions?.get('love') || 0,
        hahas: reactions?.get('haha') || 0,
        angries: reactions?.get('angry') || 0,
        cries: reactions?.get('cry') || 0,
        userReaction: userReaction?.reactionType || null,
        comments: post.comments || [],
        createdAt: post.createdAt,
      };
    });

    return {
      posts: transformedPosts,
      total,
      page,
      totalPages,
    };
  }

  async getPosts(
    page: number = 1,
    limit: number = 10,
    currentUserId?: string,
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.postModel.countDocuments().exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Transform posts to include user's reaction
    const transformedPosts = posts.map((post) => {
      const userReaction = post.userReactions?.find(
        (r: any) => r.userId === currentUserId,
      );

      const reactions = post.reactions as any;

      return {
        _id: post._id,
        userId: post.userId,
        userName: post.userName,
        userProfileImage: post.userProfileImage,
        userRole: post.userRole,
        petImage: post.petImage,
        caption: post.caption,
        likes: (reactions?.like as number) || 0,
        loves: (reactions?.love as number) || 0,
        hahas: (reactions?.haha as number) || 0,
        angries: (reactions?.angry as number) || 0,
        cries: (reactions?.cry as number) || 0,
        userReaction: userReaction?.reactionType || null,
        comments: post.comments || [],
        createdAt: post.createdAt,
      };
    });

    return {
      posts: transformedPosts,
      total,
      page,
      totalPages,
    };
  }

  async reactToPost(
    postId: string,
    userId: string,
    reactPostDto: ReactPostDto,
  ): Promise<Post> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const { reactionType } = reactPostDto;

    // Remove any existing reaction from this user
    const existingReactionIndex = post.userReactions.findIndex(
      (r) => r.userId === userId,
    );

    if (existingReactionIndex !== -1) {
      const oldReaction =
        post.userReactions[existingReactionIndex].reactionType;
      // Decrement old reaction count
      const oldCount = post.reactions.get(oldReaction) || 0;
      post.reactions.set(oldReaction, Math.max(0, oldCount - 1));
      // Remove old reaction
      post.userReactions.splice(existingReactionIndex, 1);
    }

    // Add new reaction
    post.userReactions.push({ userId, reactionType });
    const newCount = post.reactions.get(reactionType) || 0;
    post.reactions.set(reactionType, newCount + 1);

    await post.save();
    return this.getPostWithUserReaction(post, userId);
  }

  async removeReaction(
    postId: string,
    userId: string,
    reactionType: string,
  ): Promise<Post> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const reactionIndex = post.userReactions.findIndex(
      (r) => r.userId === userId && r.reactionType === reactionType,
    );

    if (reactionIndex !== -1) {
      // Remove reaction
      post.userReactions.splice(reactionIndex, 1);
      // Decrement count
      const count = post.reactions.get(reactionType) || 0;
      post.reactions.set(reactionType, Math.max(0, count - 1));
      await post.save();
    }

    return this.getPostWithUserReaction(post, userId);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only allow the post owner to delete
    if (post.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postModel.findByIdAndDelete(postId).exec();
  }

  async addComment(
    postId: string,
    userId: string,
    userName: string,
    userProfileImage: string | undefined,
    userRole: string | undefined,
    text: string,
  ): Promise<Post> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = {
      userId,
      userName,
      userProfileImage,
      userRole,
      text,
      createdAt: new Date(),
    };

    post.comments.push(comment as any);
    await post.save();

    return this.getPostWithUserReaction(post, userId);
  }

  async deleteComment(
    postId: string,
    commentId: string,
    userId: string,
  ): Promise<Post> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const commentIndex = post.comments.findIndex(
      (c: any) => c._id.toString() === commentId,
    );

    if (commentIndex === -1) {
      throw new NotFoundException('Comment not found');
    }

    // Only allow comment owner or post owner to delete
    const comment = post.comments[commentIndex] as any;
    if (
      comment.userId !== userId &&
      post.userId.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You can only delete your own comments or comments on your posts',
      );
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    return this.getPostWithUserReaction(post, userId);
  }

  private getPostWithUserReaction(post: PostDocument, userId: string): any {
    const userReaction = post.userReactions.find((r) => r.userId === userId);
    const reactions = post.reactions as any;

    return {
      _id: post._id,
      userId: post.userId,
      userName: post.userName,
      userProfileImage: post.userProfileImage,
      petImage: post.petImage,
      caption: post.caption,
      likes: (reactions?.like as number) || 0,
      loves: (reactions?.love as number) || 0,
      hahas: (reactions?.haha as number) || 0,
      angries: (reactions?.angry as number) || 0,
      cries: (reactions?.cry as number) || 0,
      userReaction: userReaction?.reactionType || null,
      comments: post.comments || [],
      createdAt: post.createdAt,
    };
  }

  async reportPost(
    postId: string,
    userId: string,
  ): Promise<{ message: string; deleted?: boolean }> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already reported this post
    if (post.reports && post.reports.includes(userId)) {
      throw new ForbiddenException('You have already reported this post');
    }

    // Add user to reports array
    if (!post.reports) {
      post.reports = [];
    }
    post.reports.push(userId);

    // If post has 3 or more reports, delete it
    if (post.reports.length >= 3) {
      await this.postModel.findByIdAndDelete(postId).exec();
      return {
        message: 'Post has been deleted due to multiple reports',
        deleted: true,
      };
    }

    await post.save();
    return {
      message: 'Post reported successfully',
      deleted: false,
    };
  }
}
