"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const post_schema_1 = require("./schemas/post.schema");
let CommunityService = class CommunityService {
    constructor(postModel) {
        this.postModel = postModel;
    }
    async createPost(userId, userName, userProfileImage, userRole, createPostDto) {
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
    async getMyPosts(page = 1, limit = 10, userId) {
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
        const transformedPosts = posts.map((post) => {
            const userReaction = post.userReactions?.find((r) => r.userId === userId);
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
    async getPosts(page = 1, limit = 10, currentUserId) {
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
        const transformedPosts = posts.map((post) => {
            const userReaction = post.userReactions?.find((r) => r.userId === currentUserId);
            const reactions = post.reactions;
            return {
                _id: post._id,
                userId: post.userId,
                userName: post.userName,
                userProfileImage: post.userProfileImage,
                userRole: post.userRole,
                petImage: post.petImage,
                caption: post.caption,
                likes: reactions?.like || 0,
                loves: reactions?.love || 0,
                hahas: reactions?.haha || 0,
                angries: reactions?.angry || 0,
                cries: reactions?.cry || 0,
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
    async reactToPost(postId, userId, reactPostDto) {
        const post = await this.postModel.findById(postId).exec();
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const { reactionType } = reactPostDto;
        const existingReactionIndex = post.userReactions.findIndex((r) => r.userId === userId);
        if (existingReactionIndex !== -1) {
            const oldReaction = post.userReactions[existingReactionIndex].reactionType;
            const oldCount = post.reactions.get(oldReaction) || 0;
            post.reactions.set(oldReaction, Math.max(0, oldCount - 1));
            post.userReactions.splice(existingReactionIndex, 1);
        }
        post.userReactions.push({ userId, reactionType });
        const newCount = post.reactions.get(reactionType) || 0;
        post.reactions.set(reactionType, newCount + 1);
        await post.save();
        return this.getPostWithUserReaction(post, userId);
    }
    async removeReaction(postId, userId, reactionType) {
        const post = await this.postModel.findById(postId).exec();
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const reactionIndex = post.userReactions.findIndex((r) => r.userId === userId && r.reactionType === reactionType);
        if (reactionIndex !== -1) {
            post.userReactions.splice(reactionIndex, 1);
            const count = post.reactions.get(reactionType) || 0;
            post.reactions.set(reactionType, Math.max(0, count - 1));
            await post.save();
        }
        return this.getPostWithUserReaction(post, userId);
    }
    async deletePost(postId, userId) {
        const post = await this.postModel.findById(postId).exec();
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own posts');
        }
        await this.postModel.findByIdAndDelete(postId).exec();
    }
    async addComment(postId, userId, userName, userProfileImage, userRole, text) {
        const post = await this.postModel.findById(postId).exec();
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const comment = {
            userId,
            userName,
            userProfileImage,
            userRole,
            text,
            createdAt: new Date(),
        };
        post.comments.push(comment);
        await post.save();
        return this.getPostWithUserReaction(post, userId);
    }
    async deleteComment(postId, commentId, userId) {
        const post = await this.postModel.findById(postId).exec();
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const commentIndex = post.comments.findIndex((c) => c._id.toString() === commentId);
        if (commentIndex === -1) {
            throw new common_1.NotFoundException('Comment not found');
        }
        const comment = post.comments[commentIndex];
        if (comment.userId !== userId &&
            post.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own comments or comments on your posts');
        }
        post.comments.splice(commentIndex, 1);
        await post.save();
        return this.getPostWithUserReaction(post, userId);
    }
    getPostWithUserReaction(post, userId) {
        const userReaction = post.userReactions.find((r) => r.userId === userId);
        const reactions = post.reactions;
        return {
            _id: post._id,
            userId: post.userId,
            userName: post.userName,
            userProfileImage: post.userProfileImage,
            petImage: post.petImage,
            caption: post.caption,
            likes: reactions?.like || 0,
            loves: reactions?.love || 0,
            hahas: reactions?.haha || 0,
            angries: reactions?.angry || 0,
            cries: reactions?.cry || 0,
            userReaction: userReaction?.reactionType || null,
            comments: post.comments || [],
            createdAt: post.createdAt,
        };
    }
    async reportPost(postId, userId) {
        const post = await this.postModel.findById(postId).exec();
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.reports && post.reports.includes(userId)) {
            throw new common_1.ForbiddenException('You have already reported this post');
        }
        if (!post.reports) {
            post.reports = [];
        }
        post.reports.push(userId);
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
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_schema_1.Post.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CommunityService);
//# sourceMappingURL=community.service.js.map