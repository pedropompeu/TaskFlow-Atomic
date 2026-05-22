import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  @SubscribeMessage('identify')
  handleIdentify(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    if (payload?.userId) {
      client.join(`user:${payload.userId}`);
    }
  }

  handleDisconnect(_client: Socket) {}

  pushToUser(userId: string, notification: object) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
