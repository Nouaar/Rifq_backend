// src/modules/messages/messages.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all conversations for the current user',
    description: 'Returns a list of all conversations the user is part of',
  })
  async getConversations(@CurrentUser() user: User) {
    const userId = String(user._id ?? user.id);
    return this.messagesService.getConversations(userId);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Get or create a conversation',
    description:
      'Gets an existing conversation with a participant or creates a new one if it does not exist',
  })
  async getOrCreateConversation(
    @CurrentUser() user: User,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    const userId = String(user._id ?? user.id);
    return this.messagesService.getOrCreateConversation(
      userId,
      createConversationDto.participantId,
    );
  }

  @Get('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get messages for a conversation',
    description: 'Returns all messages in a specific conversation',
  })
  async getMessages(@Param('id') id: string, @CurrentUser() user: User) {
    const userId = String(user._id ?? user.id);
    return this.messagesService.getMessages(id, userId);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark messages as read',
    description:
      'Marks all messages in a conversation as read for the current user',
  })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    const userId = String(user._id ?? user.id);
    return this.messagesService.markAsRead(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Send a message',
    description:
      'Sends a message to a recipient. Creates a new conversation if conversationId is not provided. Can include an audio file.',
  })
  async sendMessage(
    @CurrentUser() user: User,
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFile() audioFile?: Express.Multer.File,
  ) {
    const userId = String(user._id ?? user.id);
    return this.messagesService.sendMessage(
      userId,
      createMessageDto,
      audioFile,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a message',
    description:
      'Updates the content of a message. Only the sender can update their own messages.',
  })
  async updateMessage(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    const userId = String(user._id ?? user.id);
    return this.messagesService.updateMessage(
      id,
      userId,
      updateMessageDto.content,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a message',
    description:
      'Soft deletes a message. Only the sender can delete their own messages.',
  })
  async deleteMessage(@Param('id') id: string, @CurrentUser() user: User) {
    const userId = String(user._id ?? user.id);
    return this.messagesService.deleteMessage(id, userId);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a conversation',
    description:
      'Deletes a conversation. Only participants can delete their conversations.',
  })
  async deleteConversation(@Param('id') id: string, @CurrentUser() user: User) {
    const userId = String(user._id ?? user.id);
    return this.messagesService.deleteConversation(id, userId);
  }
}
