import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card, CardStatus } from '../cards/entities/card.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async getSummary(boardId?: string, startDate?: string, endDate?: string) {
    const [cardsByStatus, cardsByAssignee, overdueCards, completionsOverTime] =
      await Promise.all([
        this.getCardsByStatus(boardId, startDate, endDate),
        this.getCardsByAssignee(boardId, startDate, endDate),
        this.getOverdueCards(boardId),
        this.getCompletionsOverTime(boardId, startDate, endDate),
      ]);

    return { cardsByStatus, cardsByAssignee, overdueCards, completionsOverTime };
  }

  private async getCardsByStatus(boardId?: string, startDate?: string, endDate?: string) {
    const qb = this.cardRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(c.id)::int', 'count')
      .groupBy('c.status');

    if (boardId) qb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) qb.andWhere('c.created_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('c.created_at <= :endDate', { endDate: endDate + ' 23:59:59' });

    return qb.getRawMany<{ status: string; count: number }>();
  }

  private async getCardsByAssignee(boardId?: string, startDate?: string, endDate?: string) {
    const qb = this.cardRepo
      .createQueryBuilder('c')
      .leftJoin('c.assignedTo', 'u')
      .select("COALESCE(u.name, 'Unassigned')", 'assignee')
      .addSelect('COUNT(c.id)::int', 'count')
      .groupBy("COALESCE(u.name, 'Unassigned')")
      .orderBy('count', 'DESC');

    if (boardId) qb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) qb.andWhere('c.created_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('c.created_at <= :endDate', { endDate: endDate + ' 23:59:59' });

    return qb.getRawMany<{ assignee: string; count: number }>();
  }

  private async getOverdueCards(boardId?: string) {
    const qb = this.cardRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.assignedTo', 'u')
      .where('c.due_date < NOW()')
      .andWhere('c.status != :done', { done: CardStatus.DONE })
      .orderBy('c.due_date', 'ASC');

    if (boardId) qb.andWhere('c.board_id = :boardId', { boardId });
    return qb.getMany();
  }

  private async getCompletionsOverTime(boardId?: string, startDate?: string, endDate?: string) {
    const qb = this.cardRepo
      .createQueryBuilder('c')
      .select("TO_CHAR(c.updated_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(c.id)::int', 'count')
      .where('c.status = :done', { done: CardStatus.DONE })
      .groupBy("TO_CHAR(c.updated_at, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(c.updated_at, 'YYYY-MM-DD')", 'ASC');

    if (boardId) qb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) qb.andWhere('c.updated_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('c.updated_at <= :endDate', { endDate: endDate + ' 23:59:59' });

    return qb.getRawMany<{ date: string; count: number }>();
  }
}
