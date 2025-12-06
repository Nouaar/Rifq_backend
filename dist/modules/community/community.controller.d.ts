import { CommunityService } from './community.service';
import { ReactPostDto } from './dto/react-post.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class CommunityController {
    private readonly communityService;
    private readonly cloudinaryService;
    constructor(communityService: CommunityService, cloudinaryService: CloudinaryService);
    createPost(req: any, caption: string, file: Express.Multer.File): Promise<{
        message: string;
        post: import("./schemas/post.schema").Post;
    }>;
    getPosts(req: any, page?: string, limit?: string): Promise<{
        posts: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    reactToPost(req: any, postId: string, reactPostDto: ReactPostDto): Promise<{
        message: string;
        post: import("./schemas/post.schema").Post;
    }>;
    removeReaction(req: any, postId: string, reactionType: string): Promise<{
        message: string;
        post: import("./schemas/post.schema").Post;
    }>;
    deletePost(req: any, postId: string): Promise<{
        message: string;
    }>;
}
