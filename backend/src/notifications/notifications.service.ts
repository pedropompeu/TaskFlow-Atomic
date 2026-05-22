import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(userId: string, type: NotificationType, payload: Record<string, any>) {
    const notification = await this.repo.save(
      this.repo.create({ userId, type, payload }),
    );
    this.gateway.pushToUser(userId, this.serialize(notification));
    return notification;
  }

  async findByUser(userId: string) {
    const rows = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return rows.map(this.serialize);
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, read: false } });
  }

  async markRead(id: string, userId: string) {
    await this.repo.update({ id, userId }, { read: true });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.repo.update({ userId, read: false }, { read: true });
    return { ok: true };
  }

  private serialize(n: Notification) {
    return {
      id: n.id,
      type: n.type,
      payload: n.payload,
      read: n.read,
      createdAt: n.createdAt,
    };
  }
}
