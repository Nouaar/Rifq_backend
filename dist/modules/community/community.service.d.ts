import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { ReactPostDto } from './dto/react-post.dto';
export declare class CommunityService {
    private postModel;
    constructor(postModel: Model<PostDocument>);
    createPost(userId: string, userName: string, userProfileImage: string, createPostDto: CreatePostDto): Promise<Post>;
    getMyPosts(page: number, limit: number, userId: string): Promise<{
        posts: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getPosts(page?: number, limit?: number, currentUserId?: string): Promise<{
        posts: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    reactToPost(postId: string, userId: string, reactPostDto: ReactPostDto): Promise<Post>;
    removeReaction(postId: string, userId: string, reactionType: string): Promise<Post>;
    deletePost(postId: string, userId: string): Promise<void>;
    private getPostWithUserReaction;
}
