import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Card } from './entities/card.entity';

const TRASH_TTL_DAYS = 7;

@Injectable()
export class CardTrashPurgeCron {
  private readonly logger = new Logger(CardTrashPurgeCron.name);

  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredTrash(): Promise<void> {
    const cutoff = new Date(Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000);

    const expired = await this.cardRepository.find({
      where: { deletedAt: LessThan(cutoff) },
      withDeleted: true,
      select: ['id'],
    });

    if (!expired.length) return;

    await this.cardRepository.delete(expired.map((c) => c.id));
    this.logger.log(`Trash purge: permanently deleted ${expired.length} card(s)`);
  }
}
