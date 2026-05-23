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
    let prevStart: string | undefined;
    let prevEnd: string | undefined;
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end   = new Date(endDate).getTime();
      const dur   = end - start;
      prevEnd   = new Date(start - 86_400_000).toISOString().slice(0, 10);
      prevStart = new Date(start - dur - 86_400_000).toISOString().slice(0, 10);
    }

    const [
      cardsByStatus, cardsByAssignee, overdueCards, completionsOverTime,
      curTotal, curDone,
      prevTotal, prevDone,
    ] = await Promise.all([
      this.getCardsByStatus(boardId, startDate, endDate),
      this.getCardsByAssignee(boardId, startDate, endDate),
      this.getOverdueCards(boardId),
      this.getCompletionsOverTime(boardId, startDate, endDate),
      this.countCards(boardId, startDate, endDate),
      this.countDoneCards(boardId, startDate, endDate),
      prevStart ? this.countCards(boardId, prevStart, prevEnd)    : Promise.resolve(0),
      prevStart ? this.countDoneCards(boardId, prevStart, prevEnd) : Promise.resolve(0),
    ]);

    return {
      cardsByStatus,
      cardsByAssignee,
      overdueCards,
      completionsOverTime,
      kpis: {
        current:  { totalCards: curTotal, doneCount: curDone, overdueCount: overdueCards.length },
        previous: prevStart ? { totalCards: prevTotal, doneCount: prevDone } : null,
      },
    };
  }

  private async countCards(boardId?: string, startDate?: string, endDate?: string): Promise<number> {
    const qb = this.cardRepo.createQueryBuilder('c').select('COUNT(c.id)::int', 'count');
    if (boardId)   qb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) qb.andWhere('c.created_at >= :startDate', { startDate });
    if (endDate)   qb.andWhere('c.created_at <= :endDate', { endDate: endDate + ' 23:59:59' });
    const r = await qb.getRawOne<{ count: number }>();
    return Number(r?.count ?? 0);
  }

  private async countDoneCards(boardId?: string, startDate?: string, endDate?: string): Promise<number> {
    const qb = this.cardRepo
      .createQueryBuilder('c')
      .select('COUNT(c.id)::int', 'count')
      .where('c.status = :done', { done: CardStatus.DONE });
    if (boardId)   qb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) qb.andWhere('c.updated_at >= :startDate', { startDate });
    if (endDate)   qb.andWhere('c.updated_at <= :endDate', { endDate: endDate + ' 23:59:59' });
    const r = await qb.getRawOne<{ count: number }>();
    return Number(r?.count ?? 0);
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
      .leftJoin('c.assignees', 'u')
      .select("COALESCE(u.name, 'Sem responsável')", 'assignee')
      .addSelect('COUNT(c.id)::int', 'count')
      .groupBy("COALESCE(u.name, 'Sem responsável')")
      .orderBy('count', 'DESC');

    if (boardId) qb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) qb.andWhere('c.created_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('c.created_at <= :endDate', { endDate: endDate + ' 23:59:59' });

    return qb.getRawMany<{ assignee: string; count: number }>();
  }

  private async getOverdueCards(boardId?: string) {
    const qb = this.cardRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.assignees', 'assignees')
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
