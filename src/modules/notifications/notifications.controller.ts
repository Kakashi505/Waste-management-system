import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService, Notification } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @ApiOperation({ summary: '通知送信' })
  @ApiResponse({ status: 201, description: '通知送信成功' })
  async sendNotification(
    @Body() notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>,
  ) {
    return this.notificationsService.sendNotification(notificationData);
  }

  @Post('case-update')
  @ApiOperation({ summary: '案件更新通知送信' })
  @ApiResponse({ status: 201, description: '通知送信成功' })
  async sendCaseUpdateNotification(
    @Body() data: { caseId: string; message: string; userId?: string },
  ) {
    return this.notificationsService.sendCaseUpdateNotification(
      data.caseId,
      data.message,
      data.userId,
    );
  }

  @Post('auction')
  @ApiOperation({ summary: 'オークション通知送信' })
  @ApiResponse({ status: 201, description: '通知送信成功' })
  async sendAuctionNotification(
    @Body() data: { caseId: string; message: string; userId?: string },
  ) {
    return this.notificationsService.sendAuctionNotification(
      data.caseId,
      data.message,
      data.userId,
    );
  }

  @Post('system')
  @ApiOperation({ summary: 'システム通知送信' })
  @ApiResponse({ status: 201, description: '通知送信成功' })
  async sendSystemNotification(
    @Body() data: { message: string; type?: 'info' | 'success' | 'warning' | 'error' },
  ) {
    return this.notificationsService.sendSystemNotification(data.message, data.type);
  }

  @Post('photo-validation')
  @ApiOperation({ summary: '写真検証通知送信' })
  @ApiResponse({ status: 201, description: '通知送信成功' })
  async sendPhotoValidationNotification(
    @Body() data: { caseId: string; isValid: boolean; userId?: string },
  ) {
    return this.notificationsService.sendPhotoValidationNotification(
      data.caseId,
      data.isValid,
      data.userId,
    );
  }

  @Post('gps-event')
  @ApiOperation({ summary: 'GPSイベント通知送信' })
  @ApiResponse({ status: 201, description: '通知送信成功' })
  async sendGpsEventNotification(
    @Body() data: { caseId: string; eventType: string; status: string; userId?: string },
  ) {
    return this.notificationsService.sendGpsEventNotification(
      data.caseId,
      data.eventType,
      data.status,
      data.userId,
    );
  }

  @Post('jwnet-job')
  @ApiOperation({ summary: 'JWNETジョブ通知送信' })
  @ApiResponse({ status: 201, description: '通知送信成功' })
  async sendJwnetJobNotification(
    @Body() data: { caseId: string; jobType: string; status: string; userId?: string },
  ) {
    return this.notificationsService.sendJwnetJobNotification(
      data.caseId,
      data.jobType,
      data.status,
      data.userId,
    );
  }
}
