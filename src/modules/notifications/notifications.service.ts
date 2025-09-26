import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId?: string;
  caseId?: string;
  data?: any;
  createdAt: Date;
  read: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(private notificationsGateway: NotificationsGateway) {}

  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date(),
      read: false,
    };

    // 特定のユーザーに送信
    if (notification.userId) {
      this.notificationsGateway.sendToUser(notification.userId, fullNotification);
    } else {
      // 全ユーザーに送信
      this.notificationsGateway.sendToAll(fullNotification);
    }

    return fullNotification;
  }

  async sendCaseUpdateNotification(caseId: string, message: string, userId?: string) {
    return this.sendNotification({
      type: 'info',
      title: '案件更新',
      message,
      caseId,
      userId,
    });
  }

  async sendAuctionNotification(caseId: string, message: string, userId?: string) {
    return this.sendNotification({
      type: 'warning',
      title: 'オークション通知',
      message,
      caseId,
      userId,
    });
  }

  async sendSystemNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    return this.sendNotification({
      type,
      title: 'システム通知',
      message,
    });
  }

  async sendPhotoValidationNotification(caseId: string, isValid: boolean, userId?: string) {
    return this.sendNotification({
      type: isValid ? 'success' : 'warning',
      title: '写真検証結果',
      message: isValid ? '写真の検証が完了しました' : '写真の検証で問題が発見されました',
      caseId,
      userId,
    });
  }

  async sendGpsEventNotification(caseId: string, eventType: string, status: string, userId?: string) {
    return this.sendNotification({
      type: status === 'OK' ? 'success' : 'warning',
      title: 'GPSイベント',
      message: `${eventType}: ${status}`,
      caseId,
      userId,
    });
  }

  async sendJwnetJobNotification(caseId: string, jobType: string, status: string, userId?: string) {
    return this.sendNotification({
      type: status === '完了' ? 'success' : status === 'エラー' ? 'error' : 'info',
      title: 'JWNET連携',
      message: `${jobType}: ${status}`,
      caseId,
      userId,
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
