import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card, CardStatus } from '../cards/entities/card.entity';
import { CardHistory } from '../cards/entities/card-history.entity';
import { Board } from '../boards/entities/board.entity';
import { BoardMember } from '../boards/entities/board-member.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(CardHistory)
    private readonly historyRepo: Repository<CardHistory>,
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepo: Repository<BoardMember>,
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
      curTotal, curDone, curReopened,
      prevTotal, prevDone,
    ] = await Promise.all([
      this.getCardsByStatus(boardId, startDate, endDate),
      this.getCardsByAssignee(boardId, startDate, endDate),
      this.getOverdueCards(boardId),
      this.getCompletionsOverTime(boardId, startDate, endDate),
      this.countCards(boardId, startDate, endDate),
      this.countDoneCards(boardId, startDate, endDate),
      this.countReopenedCards(boardId, startDate, endDate),
      prevStart ? this.countCards(boardId, prevStart, prevEnd)     : Promise.resolve(0),
      prevStart ? this.countDoneCards(boardId, prevStart, prevEnd) : Promise.resolve(0),
    ]);

    return {
      cardsByStatus,
      cardsByAssignee,
      overdueCards,
      completionsOverTime,
      kpis: {
        current:  { totalCards: curTotal, doneCount: curDone, overdueCount: overdueCards.length, reopenedCount: curReopened },
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
    const qb = this.historyRepo
      .createQueryBuilder('h')
      .innerJoin('h.card', 'c')
      .select('COUNT(DISTINCT c.id)::int', 'count')
      .where('h.to_status = :done', { done: CardStatus.DONE });
    if (boardId)   qb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) qb.andWhere('h.created_at >= :startDate', { startDate });
    if (endDate)   qb.andWhere('h.created_at <= :endDate', { endDate: endDate + ' 23:59:59' });
    const r = await qb.getRawOne<{ count: number }>();
    return Number(r?.count ?? 0);
  }

  private async countReopenedCards(boardId?: string, startDate?: string, endDate?: string): Promise<number> {
    const qb = this.historyRepo
      .createQueryBuilder('h')
      .innerJoin('h.card', 'c')
      .select('COUNT(DISTINCT c.id)::int', 'count')
      .where('h.from_status = :done', { done: CardStatus.DONE });
    if (boardId)   qb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) qb.andWhere('h.created_at >= :startDate', { startDate });
    if (endDate)   qb.andWhere('h.created_at <= :endDate', { endDate: endDate + ' 23:59:59' });
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

  async getActivityFeed(
    userId: string,
    boardId?: string,
    startDate?: string,
    endDate?: string,
    limit = 50,
  ) {
    if (boardId && !await this.canAccessBoard(boardId, userId)) {
      throw new ForbiddenException();
    }

    const qb = this.historyRepo
      .createQueryBuilder('h')
      .innerJoin('h.card', 'c')
      .innerJoin('h.user', 'u')
      .select([
        'h.id          AS id',
        'h.action      AS action',
        'h.description AS description',
        'h.created_at  AS "createdAt"',
        'c.id          AS "cardId"',
        'c.title       AS "cardTitle"',
        'u.id          AS "userId"',
        'u.name        AS "userName"',
      ])
      .orderBy('h.created_at', 'DESC')
      .limit(limit);

    if (boardId) {
      qb.where('c.board_id = :boardId', { boardId });
    }
    if (startDate) {
      qb.andWhere('h.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('h.created_at <= :endDate', { endDate: endDate + ' 23:59:59' });
    }

    return qb.getRawMany();
  }

  private async canAccessBoard(boardId: string, userId: string): Promise<boolean> {
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) return false;
    if (board.ownerId === userId) return true;
    const member = await this.boardMemberRepo.findOne({ where: { boardId, userId } });
    return !!member;
  }

  private async getCompletionsOverTime(
    boardId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ date: string; count: number; reopened: number }[]> {
    const completionQb = this.historyRepo
      .createQueryBuilder('h')
      .innerJoin('h.card', 'c')
      .select("TO_CHAR(h.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(h.id)::int', 'count')
      .where('h.to_status = :done', { done: CardStatus.DONE })
      .groupBy("TO_CHAR(h.created_at, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(h.created_at, 'YYYY-MM-DD')", 'ASC');
    if (boardId)   completionQb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) completionQb.andWhere('h.created_at >= :startDate', { startDate });
    if (endDate)   completionQb.andWhere('h.created_at <= :endDate', { endDate: endDate + ' 23:59:59' });

    const reopenedQb = this.historyRepo
      .createQueryBuilder('h')
      .innerJoin('h.card', 'c')
      .select("TO_CHAR(h.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(h.id)::int', 'count')
      .where('h.from_status = :done', { done: CardStatus.DONE })
      .groupBy("TO_CHAR(h.created_at, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(h.created_at, 'YYYY-MM-DD')", 'ASC');
    if (boardId)   reopenedQb.andWhere('c.board_id = :boardId', { boardId });
    if (startDate) reopenedQb.andWhere('h.created_at >= :startDate', { startDate });
    if (endDate)   reopenedQb.andWhere('h.created_at <= :endDate', { endDate: endDate + ' 23:59:59' });

    const [completions, reopened] = await Promise.all([
      completionQb.getRawMany<{ date: string; count: number }>(),
      reopenedQb.getRawMany<{ date: string; count: number }>(),
    ]);

    const completionMap = new Map(completions.map((r) => [r.date, Number(r.count)]));
    const reopenedMap   = new Map(reopened.map((r) => [r.date, Number(r.count)]));
    const allDates      = new Set([...completionMap.keys(), ...reopenedMap.keys()]);

    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        count:    completionMap.get(date) ?? 0,
        reopened: reopenedMap.get(date)   ?? 0,
      }));
  }
}
