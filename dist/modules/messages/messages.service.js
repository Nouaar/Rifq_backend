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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const conversation_schema_1 = require("./schemas/conversation.schema");
const message_schema_1 = require("./schemas/message.schema");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const fcm_service_1 = require("../fcm/fcm.service");
let MessagesService = class MessagesService {
    constructor(conversationModel, messageModel, userModel, cloudinaryService, fcmService) {
        this.conversationModel = conversationModel;
        this.messageModel = messageModel;
        this.userModel = userModel;
        this.cloudinaryService = cloudinaryService;
        this.fcmService = fcmService;
    }
    async getOrCreateConversation(userId, participantId) {
        if (userId === participantId) {
            throw new common_1.BadRequestException('Cannot create conversation with yourself');
        }
        const participant = await this.userModel.findById(participantId);
        if (!participant) {
            throw new common_1.NotFoundException('Participant not found');
        }
        const participants = [userId, participantId].sort();
        let conversation = await this.conversationModel
            .findOne({
            participants: { $all: participants },
        })
            .populate('participants', 'name email profileImage')
            .populate({
            path: 'lastMessage',
            populate: { path: 'sender', select: 'name email' },
        })
            .exec();
        if (conversation && conversation.participants.length !== 2) {
            conversation = null;
        }
        if (!conversation) {
            conversation = new this.conversationModel({
                participants,
            });
            conversation.unreadCounts = new Map();
            conversation.unreadCounts.set(String(userId), 0);
            conversation.unreadCounts.set(String(participantId), 0);
            await conversation.save();
            await conversation.populate([
                { path: 'participants', select: 'name email profileImage' },
            ]);
        }
        return conversation;
    }
    async getConversations(userId) {
        const conversations = await this.conversationModel
            .find({
            participants: userId,
        })
            .populate('participants', 'name email profileImage')
            .populate({
            path: 'lastMessage',
            populate: { path: 'sender', select: 'name email' },
        })
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .exec();
        return conversations.map((conv) => {
            const unreadCount = conv.unreadCounts?.get?.(String(userId)) || 0;
            const formattedConv = conv.toObject();
            formattedConv.unreadCount = unreadCount;
            return formattedConv;
        });
    }
    async getMessages(conversationId, userId) {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const participantIds = conversation.participants.map((p) => String(p));
        if (!participantIds.includes(userId)) {
            throw new common_1.ForbiddenException('You are not a participant in this conversation');
        }
        let conversationObjectId;
        try {
            conversationObjectId = new mongoose_2.Types.ObjectId(conversationId);
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid conversation ID format');
        }
        const messages = await this.messageModel
            .find({ conversation: conversationObjectId })
            .populate('sender', 'name email profileImage')
            .populate('recipient', 'name email profileImage')
            .sort({ createdAt: 1 })
            .exec();
        return messages;
    }
    async sendMessage(userId, createMessageDto, audioFile) {
        const { recipientId, content, conversationId } = createMessageDto;
        if (userId === recipientId) {
            throw new common_1.BadRequestException('Cannot send message to yourself');
        }
        const recipient = await this.userModel.findById(recipientId);
        if (!recipient) {
            throw new common_1.NotFoundException('Recipient not found');
        }
        let conversation;
        if (conversationId) {
            conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            const participantIds = conversation.participants.map((p) => String(p));
            if (!participantIds.includes(userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            if (!participantIds.includes(recipientId)) {
                throw new common_1.BadRequestException('Recipient is not a participant in this conversation');
            }
        }
        else {
            conversation = await this.getOrCreateConversation(userId, recipientId);
        }
        let audioURL;
        if (audioFile) {
            try {
                const uploadResult = await this.cloudinaryService.uploadAudio(audioFile, 'messages/audio');
                audioURL = uploadResult.secure_url;
            }
            catch (error) {
                console.error('Failed to upload audio file:', error);
                throw new common_1.BadRequestException('Failed to upload audio file');
            }
        }
        const message = new this.messageModel({
            conversation: conversation._id,
            sender: userId,
            recipient: recipientId,
            content,
            read: false,
            audioURL,
        });
        await message.save();
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        if (!conversation.unreadCounts) {
            conversation.unreadCounts = new Map();
        }
        const currentUnread = conversation.unreadCounts.get?.(String(recipientId)) || 0;
        conversation.unreadCounts.set(String(recipientId), currentUnread + 1);
        conversation.unreadCounts.set(String(userId), 0);
        await conversation.save();
        await message.populate([
            { path: 'sender', select: 'name email profileImage' },
            { path: 'recipient', select: 'name email profileImage' },
        ]);
        try {
            const recipient = await this.userModel.findById(recipientId).select('fcmToken name').exec();
            if (recipient?.fcmToken) {
                const sender = await this.userModel.findById(userId).select('name').exec();
                const senderName = sender?.name || 'Someone';
                this.fcmService
                    .sendMessageNotification(recipient.fcmToken, senderName, content, String(conversation._id), String(message._id))
                    .catch((error) => {
                    console.error('Failed to send FCM notification:', error);
                });
            }
        }
        catch (error) {
            console.error('Error sending FCM notification:', error);
        }
        return message;
    }
    async markAsRead(conversationId, userId) {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const participantIds = conversation.participants.map((p) => String(p));
        if (!participantIds.includes(userId)) {
            throw new common_1.ForbiddenException('You are not a participant in this conversation');
        }
        let conversationObjectId;
        try {
            conversationObjectId = new mongoose_2.Types.ObjectId(conversationId);
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid conversation ID format');
        }
        await this.messageModel
            .updateMany({
            conversation: conversationObjectId,
            recipient: userId,
            read: false,
        }, {
            $set: {
                read: true,
                readAt: new Date(),
            },
        })
            .exec();
        if (!conversation.unreadCounts) {
            conversation.unreadCounts = new Map();
        }
        conversation.unreadCounts.set(String(userId), 0);
        await conversation.save();
        return { message: 'Messages marked as read' };
    }
    async updateMessage(messageId, userId, content) {
        const message = await this.messageModel.findById(messageId);
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (String(message.sender) !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own messages');
        }
        if (message.isDeleted) {
            throw new common_1.BadRequestException('Cannot edit a deleted message');
        }
        message.content = content;
        message.editedAt = new Date();
        await message.save();
        await message.populate([
            { path: 'sender', select: 'name email profileImage' },
            { path: 'recipient', select: 'name email profileImage' },
        ]);
        return message;
    }
    async deleteMessage(messageId, userId) {
        const message = await this.messageModel.findById(messageId);
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (String(message.sender) !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own messages');
        }
        message.isDeleted = true;
        message.content = 'This message has been deleted';
        await message.save();
        await message.populate([
            { path: 'sender', select: 'name email profileImage' },
            { path: 'recipient', select: 'name email profileImage' },
        ]);
        return message;
    }
    async deleteConversation(conversationId, userId) {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const participantIds = conversation.participants.map((p) => String(p));
        if (!participantIds.includes(userId)) {
            throw new common_1.ForbiddenException('You are not a participant in this conversation');
        }
        await this.messageModel.deleteMany({
            conversation: new mongoose_2.Types.ObjectId(conversationId),
        });
        await this.conversationModel.findByIdAndDelete(conversationId);
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(conversation_schema_1.Conversation.name)),
    __param(1, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(2, (0, mongoose_1.InjectModel)('User')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        cloudinary_service_1.CloudinaryService,
        fcm_service_1.FcmService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map