import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { User } from '../users/schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const userId = String(user._id ?? user.id);
    const unreadOnlyBool = unreadOnly === 'true';
    return this.notificationsService.findAll(userId, unreadOnlyBool);
  }

  @Get('count/unread')
  async getUnreadCount(@CurrentUser() user: User) {
    const userId = String(user._id ?? user.id);
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    const userId = String(user._id ?? user.id);
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: User) {
    const userId = String(user._id ?? user.id);
    await this.notificationsService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    const userId = String(user._id ?? user.id);
    return this.notificationsService.remove(id, userId);
  }
}
