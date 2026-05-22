import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface PresenceEntry {
  boardId: string;
  userId: string;
  userName: string;
}

@WebSocketGateway({
  namespace: '/boards',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class BoardGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly presence = new Map<string, PresenceEntry>();

  @SubscribeMessage('join-board')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; userId: string; userName: string },
  ) {
    client.join(`board:${payload.boardId}`);
    this.presence.set(client.id, payload);
    this.broadcastPresence(payload.boardId);
  }

  @SubscribeMessage('leave-board')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string },
  ) {
    client.leave(`board:${payload.boardId}`);
    this.presence.delete(client.id);
    this.broadcastPresence(payload.boardId);
  }

  handleDisconnect(client: Socket) {
    const entry = this.presence.get(client.id);
    if (entry) {
      this.presence.delete(client.id);
      this.broadcastPresence(entry.boardId);
    }
  }

  notifyBoardUpdated(boardId: string, type: string) {
    this.server.to(`board:${boardId}`).emit('board-updated', { boardId, type });
  }

  private broadcastPresence(boardId: string) {
    const users = [...this.presence.values()]
      .filter((p) => p.boardId === boardId)
      .map(({ userId, userName }) => ({ userId, userName }));
    this.server.to(`board:${boardId}`).emit('presence', { boardId, users });
  }
}
