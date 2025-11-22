// src/modules/messages/messages.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FcmService } from '../fcm/fcm.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(
    userId: string,
    participantId: string,
  ): Promise<ConversationDocument> {
    // Ensure user is not trying to chat with themselves
    if (userId === participantId) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Verify participant exists
    const participant = await this.userModel.findById(participantId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Normalize participant IDs (sort to ensure consistent lookup)
    const participants = [userId, participantId].sort();

    // Try to find existing conversation - find conversation where participants array contains both users and has exactly 2 participants
    // We query for conversations that contain both participants, then filter by size in code if needed
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
    
    // Filter to ensure it's a 2-participant conversation
    if (conversation && conversation.participants.length !== 2) {
      conversation = null;
    }

    if (!conversation) {
      // Create new conversation with normalized participants
      conversation = new this.conversationModel({
        participants,
      });
      
      // Initialize unread counts map
      conversation.unreadCounts = new Map();
      conversation.unreadCounts.set(String(userId), 0);
      conversation.unreadCounts.set(String(participantId), 0);
      
      await conversation.save();

      // Populate after save
      await conversation.populate([
        { path: 'participants', select: 'name email profileImage' },
      ]);
    }

    return conversation;
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<ConversationDocument[]> {
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

    // Format conversations with unread count for the current user
    return conversations.map((conv) => {
      const unreadCount = conv.unreadCounts?.get?.(String(userId)) || 0;
      const formattedConv = conv.toObject() as any;
      formattedConv.unreadCount = unreadCount;
      // Also ensure participants array is properly formatted
      return formattedConv as ConversationDocument;
    }) as ConversationDocument[];
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(
    conversationId: string,
    userId: string,
  ): Promise<MessageDocument[]> {
    // Verify conversation exists and user is a participant
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const participantIds = conversation.participants.map((p) =>
      String(p),
    ) as string[];
    if (!participantIds.includes(userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Get messages - ensure conversationId is converted to ObjectId for query
    let conversationObjectId: Types.ObjectId;
    try {
      conversationObjectId = new Types.ObjectId(conversationId);
    } catch (error) {
      throw new BadRequestException('Invalid conversation ID format');
    }
    
    const messages = await this.messageModel
      .find({ conversation: conversationObjectId })
      .populate('sender', 'name email profileImage')
      .populate('recipient', 'name email profileImage')
      .sort({ createdAt: 1 })
      .exec();

    return messages;
  }

  /**
   * Send a message
   */
  async sendMessage(
    userId: string,
    createMessageDto: CreateMessageDto,
    audioFile?: Express.Multer.File,
  ): Promise<MessageDocument> {
    const { recipientId, content, conversationId } = createMessageDto;

    // Ensure user is not sending to themselves
    if (userId === recipientId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Verify recipient exists
    const recipient = await this.userModel.findById(recipientId);
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    let conversation: ConversationDocument;

    if (conversationId) {
      // Use existing conversation
      conversation = await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Verify user is a participant
      const participantIds = conversation.participants.map((p) =>
        String(p),
      ) as string[];
      if (!participantIds.includes(userId)) {
        throw new ForbiddenException(
          'You are not a participant in this conversation',
        );
      }
      if (!participantIds.includes(recipientId)) {
        throw new BadRequestException(
          'Recipient is not a participant in this conversation',
        );
      }
    } else {
      // Get or create conversation
      conversation = await this.getOrCreateConversation(userId, recipientId);
    }

    // Upload audio file to Cloudinary if present
    let audioURL: string | undefined;
    if (audioFile) {
      try {
        const uploadResult = await this.cloudinaryService.uploadAudio(
          audioFile,
          'messages/audio',
        );
        audioURL = uploadResult.secure_url;
      } catch (error) {
        console.error('Failed to upload audio file:', error);
        throw new BadRequestException('Failed to upload audio file');
      }
    }

    // Create message
    const message = new this.messageModel({
      conversation: conversation._id,
      sender: userId,
      recipient: recipientId,
      content,
      read: false,
      audioURL,
    });
    await message.save();

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Increment unread count for recipient
    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }
    const currentUnread = conversation.unreadCounts.get?.(String(recipientId)) || 0;
    conversation.unreadCounts.set(String(recipientId), currentUnread + 1);

    // Reset unread count for sender (they saw their own message)
    conversation.unreadCounts.set(String(userId), 0);

    await conversation.save();

    // Populate message before returning
    await message.populate([
      { path: 'sender', select: 'name email profileImage' },
      { path: 'recipient', select: 'name email profileImage' },
    ]);

    // Send FCM notification to recipient if they have an FCM token
    try {
      const recipient = await this.userModel.findById(recipientId).select('fcmToken name').exec();
      if (recipient?.fcmToken) {
        const sender = await this.userModel.findById(userId).select('name').exec();
        const senderName = sender?.name || 'Someone';
        
        // Send notification asynchronously (don't wait for it)
        this.fcmService
          .sendMessageNotification(
            recipient.fcmToken,
            senderName,
            content,
            String(conversation._id),
            String(message._id),
          )
          .catch((error) => {
            console.error('Failed to send FCM notification:', error);
            // Don't throw - message was saved successfully, notification failure is not critical
          });
      }
    } catch (error) {
      // Log error but don't fail the message send
      console.error('Error sending FCM notification:', error);
    }

    return message;
  }

  /**
   * Mark messages in a conversation as read
   */
  async markAsRead(
    conversationId: string,
    userId: string,
  ): Promise<{ message: string }> {
    // Verify conversation exists and user is a participant
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const participantIds = conversation.participants.map((p) =>
      String(p),
    ) as string[];
    if (!participantIds.includes(userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Convert conversationId to ObjectId for query
    let conversationObjectId: Types.ObjectId;
    try {
      conversationObjectId = new Types.ObjectId(conversationId);
    } catch (error) {
      throw new BadRequestException('Invalid conversation ID format');
    }
    
    // Mark all messages sent to this user as read
    await this.messageModel
      .updateMany(
        {
          conversation: conversationObjectId,
          recipient: userId,
          read: false,
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
          },
        },
      )
      .exec();

    // Reset unread count for this user
    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }
    conversation.unreadCounts.set(String(userId), 0);
    await conversation.save();

    return { message: 'Messages marked as read' };
  }

  /**
   * Update a message
   */
  async updateMessage(
    messageId: string,
    userId: string,
    content: string,
  ): Promise<MessageDocument> {
    // Find the message
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is the sender
    if (String(message.sender) !== userId) {
      throw new ForbiddenException(
        'You can only edit your own messages',
      );
    }

    // Verify message is not deleted
    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    // Update message
    message.content = content;
    message.editedAt = new Date();
    await message.save();

    // Populate before returning
    await message.populate([
      { path: 'sender', select: 'name email profileImage' },
      { path: 'recipient', select: 'name email profileImage' },
    ]);

    return message;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument> {
    // Find the message
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is the sender
    if (String(message.sender) !== userId) {
      throw new ForbiddenException(
        'You can only delete your own messages',
      );
    }

    // Soft delete - mark as deleted instead of removing
    message.isDeleted = true;
    message.content = 'This message has been deleted';
    await message.save();

    // Populate before returning
    await message.populate([
      { path: 'sender', select: 'name email profileImage' },
      { path: 'recipient', select: 'name email profileImage' },
    ]);

    return message;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Find the conversation
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is a participant
    const participantIds = conversation.participants.map((p) =>
      String(p),
    ) as string[];
    if (!participantIds.includes(userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Delete all messages in the conversation
    await this.messageModel.deleteMany({
      conversation: new Types.ObjectId(conversationId),
    });

    // Delete the conversation
    await this.conversationModel.findByIdAndDelete(conversationId);
  }
}

