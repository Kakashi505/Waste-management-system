import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Notification } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // ユーザーとソケットのマッピングを削除
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // ユーザーIDとソケットIDをマッピング
    this.userSockets.set(data.userId, client.id);
    client.emit('authenticated', { success: true });
  }

  @SubscribeMessage('join-case')
  handleJoinCase(
    @MessageBody() data: { caseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`case-${data.caseId}`);
    client.emit('joined-case', { caseId: data.caseId });
  }

  @SubscribeMessage('leave-case')
  handleLeaveCase(
    @MessageBody() data: { caseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`case-${data.caseId}`);
    client.emit('left-case', { caseId: data.caseId });
  }

  @SubscribeMessage('join-auction')
  handleJoinAuction(
    @MessageBody() data: { caseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`auction-${data.caseId}`);
    client.emit('joined-auction', { caseId: data.caseId });
  }

  @SubscribeMessage('leave-auction')
  handleLeaveAuction(
    @MessageBody() data: { caseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`auction-${data.caseId}`);
    client.emit('left-auction', { caseId: data.caseId });
  }

  // 特定のユーザーに通知を送信
  sendToUser(userId: string, notification: Notification) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  // 全ユーザーに通知を送信
  sendToAll(notification: Notification) {
    this.server.emit('notification', notification);
  }

  // 特定の案件に関連するユーザーに通知を送信
  sendToCase(caseId: string, notification: Notification) {
    this.server.to(`case-${caseId}`).emit('notification', notification);
  }

  // オークション参加者に通知を送信
  sendToAuction(caseId: string, notification: Notification) {
    this.server.to(`auction-${caseId}`).emit('auction-notification', notification);
  }

  // リアルタイムデータ更新を送信
  sendDataUpdate(type: string, data: any, userId?: string) {
    const update = { type, data, timestamp: new Date().toISOString() };
    
    if (userId) {
      const socketId = this.userSockets.get(userId);
      if (socketId) {
        this.server.to(socketId).emit('data-update', update);
      }
    } else {
      this.server.emit('data-update', update);
    }
  }
}
