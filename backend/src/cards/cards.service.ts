import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { CardHistory, HistoryAction } from './entities/card-history.entity';
import { Board } from '../boards/entities/board.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(CardHistory)
    private readonly historyRepository: Repository<CardHistory>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  async create(boardId: string, dto: CreateCardDto, userId: string): Promise<Card> {
    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException();

    const card = this.cardRepository.create({ ...dto, boardId, createdById: userId });
    const saved = await this.cardRepository.save(card);

    await this.historyRepository.save(
      this.historyRepository.create({
        cardId: saved.id,
        userId,
        action: HistoryAction.CREATED,
        toStatus: saved.status,
        description: 'Card created',
      }),
    );

    return saved;
  }

  findByBoard(boardId: string): Promise<Card[]> {
    return this.cardRepository.find({
      where: { boardId },
      relations: ['assignedTo', 'tags'],
      order: { status: 'ASC', position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: [
        'assignedTo',
        'createdBy',
        'tags',
        'attachments',
        'attachments.uploadedBy',
        'history',
        'history.user',
      ],
      order: { history: { createdAt: 'DESC' } },
    });
    if (!card) throw new NotFoundException('Card not found');
    return card;
  }

  async update(id: string, dto: UpdateCardDto, userId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Card not found');

    const prevStatus = card.status;
    const prevAssignedToId = card.assignedToId;

    Object.assign(card, dto);
    const saved = await this.cardRepository.save(card);

    const historyEntries: Partial<CardHistory>[] = [];

    if (dto.status !== undefined && dto.status !== prevStatus) {
      historyEntries.push({
        cardId: id,
        userId,
        action: HistoryAction.MOVED,
        fromStatus: prevStatus,
        toStatus: dto.status,
        description: `Moved from ${prevStatus} to ${dto.status}`,
      });
    }

    if ('assignedToId' in dto && dto.assignedToId !== prevAssignedToId) {
      historyEntries.push({
        cardId: id,
        userId,
        action: dto.assignedToId ? HistoryAction.ASSIGNED : HistoryAction.UNASSIGNED,
        description: dto.assignedToId ? 'Card assigned' : 'Card unassigned',
      });
    }

    if ('dueDate' in dto && dto.dueDate !== undefined) {
      historyEntries.push({
        cardId: id,
        userId,
        action: HistoryAction.DUE_DATE_SET,
        description: `Due date set to ${dto.dueDate}`,
      });
    }

    if (historyEntries.length > 0) {
      await this.historyRepository.save(
        historyEntries.map((e) => this.historyRepository.create(e)),
      );
    }

    return saved;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['board'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (card.board.ownerId !== userId && card.createdById !== userId) {
      throw new ForbiddenException();
    }
    await this.cardRepository.remove(card);
    return { message: 'Card deleted' };
  }
}
