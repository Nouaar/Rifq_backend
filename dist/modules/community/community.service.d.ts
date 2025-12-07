import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { ReactPostDto } from './dto/react-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdatePostDto } from './dto/update-post.dto';
export declare class CommunityService {
    private postModel;
    private commentModel;
    constructor(postModel: Model<PostDocument>, commentModel: Model<CommentDocument>);
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
    updatePost(postId: string, userId: string, updatePostDto: UpdatePostDto): Promise<Post>;
    deletePost(postId: string, userId: string): Promise<void>;
    private getPostWithUserReaction;
    createComment(postId: string, userId: string, userName: string, userProfileImage: string, createCommentDto: CreateCommentDto): Promise<Comment>;
    getComments(postId: string, page?: number, limit?: number): Promise<{
        comments: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    deleteComment(commentId: string, userId: string): Promise<void>;
}
