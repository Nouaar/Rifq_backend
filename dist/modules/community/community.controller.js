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
exports.CommunityController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const community_service_1 = require("./community.service");
const react_post_dto_1 = require("./dto/react-post.dto");
const add_comment_dto_1 = require("./dto/add-comment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let CommunityController = class CommunityController {
    constructor(communityService, cloudinaryService) {
        this.communityService = communityService;
        this.cloudinaryService = cloudinaryService;
    }
    async createPost(req, body, file) {
        try {
            console.log('Create post request received');
            console.log('User:', req.user);
            console.log('Body:', body);
            console.log('File:', file ? 'File present' : 'No file');
            if (!file) {
                throw new common_1.BadRequestException('Pet image is required');
            }
            console.log('Uploading to Cloudinary...');
            const uploadResult = await this.cloudinaryService.uploadImage(file, 'community');
            console.log('Cloudinary upload successful:', uploadResult.secure_url);
            const createPostDto = {
                petImage: uploadResult.secure_url,
                caption: body.caption || null,
            };
            console.log('Creating post in database...');
            const post = await this.communityService.createPost(req.user._id.toString(), req.user.name, req.user.profileImage, req.user.role, createPostDto);
            console.log('Post created successfully');
            return {
                message: 'Post created successfully',
                post,
            };
        }
        catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }
    async getPosts(req, page = '1', limit = '10') {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        return this.communityService.getPosts(pageNum, limitNum, req.user._id.toString());
    }
    async getMyPosts(req, page = '1', limit = '10') {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        return this.communityService.getMyPosts(pageNum, limitNum, req.user._id.toString());
    }
    async reactToPost(req, postId, reactPostDto) {
        const post = await this.communityService.reactToPost(postId, req.user._id.toString(), reactPostDto);
        return {
            message: 'Reaction added successfully',
            post,
        };
    }
    async removeReaction(req, postId, reactionType) {
        const post = await this.communityService.removeReaction(postId, req.user._id.toString(), reactionType);
        return {
            message: 'Reaction removed successfully',
            post,
        };
    }
    async deletePost(req, postId) {
        await this.communityService.deletePost(postId, req.user._id.toString());
        return {
            message: 'Post deleted successfully',
        };
    }
    async addComment(req, postId, addCommentDto) {
        const post = await this.communityService.addComment(postId, req.user._id.toString(), req.user.name, req.user.profileImage, req.user.role, addCommentDto.text);
        return {
            message: 'Comment added successfully',
            post,
        };
    }
    async deleteComment(req, postId, commentId) {
        const post = await this.communityService.deleteComment(postId, commentId, req.user._id.toString());
        return {
            message: 'Comment deleted successfully',
            post,
        };
    }
    async reportPost(req, postId) {
        const userId = req.user._id.toString();
        const result = await this.communityService.reportPost(postId, userId);
        return result;
    }
};
exports.CommunityController = CommunityController;
__decorate([
    (0, common_1.Post)('posts'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('petImage')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createPost", null);
__decorate([
    (0, common_1.Get)('posts'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Get)('my-posts'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getMyPosts", null);
__decorate([
    (0, common_1.Post)('posts/:postId/react'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, react_post_dto_1.ReactPostDto]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "reactToPost", null);
__decorate([
    (0, common_1.Delete)('posts/:postId/react'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Query)('reactionType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "removeReaction", null);
__decorate([
    (0, common_1.Delete)('posts/:postId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Post)('posts/:postId/comments'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, add_comment_dto_1.AddCommentDto]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "addComment", null);
__decorate([
    (0, common_1.Delete)('posts/:postId/comments/:commentId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Post)('posts/:postId/report'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "reportPost", null);
exports.CommunityController = CommunityController = __decorate([
    (0, common_1.Controller)('community'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [community_service_1.CommunityService,
        cloudinary_service_1.CloudinaryService])
], CommunityController);
//# sourceMappingURL=community.controller.js.map