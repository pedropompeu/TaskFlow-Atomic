import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card, CardStatus } from '../cards/entities/card.entity';
import { EmailService } from './email.service';

@Injectable()
export class EmailDeadlineCron {
  private readonly logger = new Logger(EmailDeadlineCron.name);

  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkDeadlines(): Promise<void> {
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const cards = await this.cardRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.assignees', 'assignees')
      .where('c.due_date <= :in24h', { in24h })
      .andWhere('c.due_date > NOW()')
      .andWhere('c.status != :done', { done: CardStatus.DONE })
      .andWhere('c.deadline_reminder_sent_at IS NULL')
      .getMany();

    this.logger.log(`Deadline check: ${cards.length} card(s) approaching due date`);

    for (const card of cards) {
      if (!card.assignees?.length) continue;

      try {
        for (const assignee of card.assignees) {
          await this.emailService.enqueue({
            type: 'deadline_reminder',
            cardTitle: card.title,
            dueDate: card.dueDate.toISOString(),
            assigneeName: assignee.name,
            assigneeEmail: assignee.email,
          });
        }

        await this.cardRepository.update(card.id, {
          deadlineReminderSentAt: new Date(),
        });
      } catch (err) {
        this.logger.error(`Failed to enqueue deadline reminder for card ${card.id}`, err);
      }
    }
  }
}
