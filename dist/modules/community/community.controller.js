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
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let CommunityController = class CommunityController {
    constructor(communityService, cloudinaryService) {
        this.communityService = communityService;
        this.cloudinaryService = cloudinaryService;
    }
    async createPost(req, caption, file) {
        if (!file) {
            throw new common_1.BadRequestException('Pet image is required');
        }
        const uploadResult = await this.cloudinaryService.uploadImage(file, 'community');
        const createPostDto = {
            petImage: uploadResult.secure_url,
            caption,
        };
        const post = await this.communityService.createPost(req.user.userId, req.user.name, req.user.profileImage, createPostDto);
        return {
            message: 'Post created successfully',
            post,
        };
    }
    async getPosts(req, page = '1', limit = '10') {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        return this.communityService.getPosts(pageNum, limitNum, req.user.userId);
    }
    async reactToPost(req, postId, reactPostDto) {
        const post = await this.communityService.reactToPost(postId, req.user.userId, reactPostDto);
        return {
            message: 'Reaction added successfully',
            post,
        };
    }
    async removeReaction(req, postId, reactionType) {
        const post = await this.communityService.removeReaction(postId, req.user.userId, reactionType);
        return {
            message: 'Reaction removed successfully',
            post,
        };
    }
    async deletePost(req, postId) {
        await this.communityService.deletePost(postId, req.user.userId);
        return {
            message: 'Post deleted successfully',
        };
    }
};
exports.CommunityController = CommunityController;
__decorate([
    (0, common_1.Post)('posts'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('petImage')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('caption')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
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
exports.CommunityController = CommunityController = __decorate([
    (0, common_1.Controller)('community'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [community_service_1.CommunityService,
        cloudinary_service_1.CloudinaryService])
], CommunityController);
//# sourceMappingURL=community.controller.js.map