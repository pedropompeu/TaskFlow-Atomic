import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { Card } from './entities/card.entity';
import { CardHistory, HistoryAction } from './entities/card-history.entity';
import { CardTag } from './entities/card-tag.entity';
import { Attachment } from './entities/attachment.entity';
import { Board } from '../boards/entities/board.entity';
import { BoardMember } from '../boards/entities/board-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { AddTagDto } from './dto/add-tag.dto';
import { EmailService } from '../email/email.service';
import { BoardGateway } from './board.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(CardHistory)
    private readonly historyRepository: Repository<CardHistory>,
    @InjectRepository(CardTag)
    private readonly tagRepository: Repository<CardTag>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly boardGateway: BoardGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Create ──────────────────────────────────────────────────────────────

  async create(boardId: string, dto: CreateCardDto, userId: string): Promise<Card> {
    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (!await this.canAccessBoard(boardId, userId)) throw new ForbiddenException();

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

    this.boardGateway.notifyBoardUpdated(boardId, 'card-created');
    return saved;
  }

  // ── Read ─────────────────────────────────────────────────────────────────

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

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateCardDto, userId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Card not found');

    const prevStatus = card.status;
    const prevAssignedToId = card.assignedToId;

    Object.assign(card, dto);
    const saved = await this.cardRepository.save(card);

    const entries: Partial<CardHistory>[] = [];

    if (dto.status !== undefined && dto.status !== prevStatus) {
      entries.push({
        cardId: id, userId,
        action: HistoryAction.MOVED,
        fromStatus: prevStatus,
        toStatus: dto.status,
        description: `Moved from ${prevStatus} to ${dto.status}`,
      });
    }

    if ('assignedToId' in dto && dto.assignedToId !== prevAssignedToId) {
      entries.push({
        cardId: id, userId,
        action: dto.assignedToId ? HistoryAction.ASSIGNED : HistoryAction.UNASSIGNED,
        description: dto.assignedToId ? 'Card assigned' : 'Card unassigned',
      });
    }

    if ('dueDate' in dto && dto.dueDate !== undefined) {
      entries.push({
        cardId: id, userId,
        action: HistoryAction.DUE_DATE_SET,
        description: `Due date set to ${dto.dueDate}`,
      });
    }

    if (entries.length) {
      await this.historyRepository.save(
        entries.map((e) => this.historyRepository.create(e)),
      );
    }

    this.boardGateway.notifyBoardUpdated(saved.boardId, 'card-updated');

    // Dispatch emails + in-app notifications asynchronously
    if ('assignedToId' in dto && dto.assignedToId && dto.assignedToId !== prevAssignedToId) {
      const assignee = await this.userRepository.findOne({
        where: { id: dto.assignedToId },
        select: ['id', 'name', 'email'],
      });
      if (assignee) {
        void this.emailService.enqueue({
          type: 'card_assigned',
          cardTitle: saved.title,
          boardTitle: '',
          assigneeName: assignee.name,
          assigneeEmail: assignee.email,
        });
        void this.notificationsService.create(assignee.id, 'card_assigned', {
          cardId: saved.id,
          cardTitle: saved.title,
          boardId: saved.boardId,
        });
      }
    }

    if (dto.status !== undefined && dto.status !== prevStatus && saved.assignedToId) {
      const assignee = await this.userRepository.findOne({
        where: { id: saved.assignedToId },
        select: ['id', 'name', 'email'],
      });
      if (assignee) {
        void this.emailService.enqueue({
          type: 'status_changed',
          cardTitle: saved.title,
          fromStatus: prevStatus,
          toStatus: dto.status,
          assigneeName: assignee.name,
          assigneeEmail: assignee.email,
        });
      }
    }

    return saved;
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['board'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (!await this.canAccessBoard(card.boardId, userId)) {
      throw new ForbiddenException();
    }
    const boardId = card.boardId;
    await this.cardRepository.remove(card);
    this.boardGateway.notifyBoardUpdated(boardId, 'card-deleted');
    return { message: 'Card deleted' };
  }

  // ── Reorder ───────────────────────────────────────────────────────────────

  async reorder(boardId: string, orderedIds: string[]): Promise<void> {
    await this.cardRepository.manager.transaction(async (manager) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await manager.update(Card, { id: orderedIds[i], boardId }, { position: i });
      }
    });
    this.boardGateway.notifyBoardUpdated(boardId, 'card-reordered');
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  async addTag(cardId: string, dto: AddTagDto, userId: string): Promise<CardTag> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    const tag = await this.tagRepository.save(
      this.tagRepository.create({
        cardId,
        name: dto.name,
        color: dto.color ?? '#6B7280',
      }),
    );

    await this.historyRepository.save(
      this.historyRepository.create({
        cardId, userId,
        action: HistoryAction.TAG_ADDED,
        description: `Tag "${dto.name}" added`,
      }),
    );

    return tag;
  }

  async removeTag(tagId: string): Promise<{ message: string }> {
    const tag = await this.tagRepository.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('Tag not found');
    await this.tagRepository.remove(tag);
    return { message: 'Tag removed' };
  }

  // ── Attachments ───────────────────────────────────────────────────────────

  async addAttachment(
    cardId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Attachment> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    const attachment = await this.attachmentRepository.save(
      this.attachmentRepository.create({
        cardId,
        uploadedById: userId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
      }),
    );

    await this.historyRepository.save(
      this.historyRepository.create({
        cardId, userId,
        action: HistoryAction.ATTACHMENT_ADDED,
        description: `Attached "${file.originalname}"`,
      }),
    );

    return attachment;
  }

  async removeAttachment(
    attachmentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    if (existsSync(attachment.path)) {
      try { unlinkSync(attachment.path); } catch {}
    }

    await this.attachmentRepository.remove(attachment);
    return { message: 'Attachment deleted' };
  }

  // ── Access helper ─────────────────────────────────────────────────────────

  private async canAccessBoard(boardId: string, userId: string): Promise<boolean> {
    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (!board) return false;
    if (board.ownerId === userId) return true;
    const m = await this.boardMemberRepository.findOne({ where: { boardId, userId } });
    return !!m;
  }
}
