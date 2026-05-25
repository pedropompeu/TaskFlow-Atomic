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
import { ChecklistItem } from './entities/checklist-item.entity';
import { Attachment } from './entities/attachment.entity';
import { CardComment } from './entities/card-comment.entity';
import { Board } from '../boards/entities/board.entity';
import { BoardMember } from '../boards/entities/board-member.entity';
import { BoardTag } from '../boards/entities/board-tag.entity';
import { User } from '../users/entities/user.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { AddTagDto } from './dto/add-tag.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EmailService } from '../email/email.service';
import { BoardGateway } from './board.gateway';
import { NotificationsService } from '../notifications/notifications.service';

const STATUS_LABEL: Record<string, string> = {
  todo:        'A Fazer',
  in_progress: 'Em Andamento',
  in_review:   'Em Revisão',
  done:        'Concluído',
};

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
    @InjectRepository(CardComment)
    private readonly commentRepository: Repository<CardComment>,
    @InjectRepository(ChecklistItem)
    private readonly checklistRepository: Repository<ChecklistItem>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    @InjectRepository(BoardTag)
    private readonly boardTagRepository: Repository<BoardTag>,
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
        description: 'Card criado',
      }),
    );

    this.boardGateway.notifyBoardUpdated(boardId, 'card-created');
    return saved;
  }

  // ── Read ─────────────────────────────────────────────────────────────────

  findByBoard(boardId: string): Promise<Card[]> {
    return this.cardRepository.find({
      where: { boardId },
      relations: ['assignedTo', 'tags', 'assignees'],
      relationLoadStrategy: 'query',
      order: { status: 'ASC', position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: [
        'assignedTo',
        'assignees',
        'createdBy',
        'tags',
        'checklists',
        'attachments',
        'attachments.uploadedBy',
        'history',
        'history.user',
        'comments',
        'comments.user',
      ],
      order: { history: { createdAt: 'DESC' }, comments: { createdAt: 'ASC' }, checklists: { position: 'ASC' } },
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
        description: `Movido de "${STATUS_LABEL[prevStatus] ?? prevStatus}" para "${STATUS_LABEL[dto.status] ?? dto.status}"`,
      });
    }

    if ('assignedToId' in dto && dto.assignedToId !== prevAssignedToId) {
      entries.push({
        cardId: id, userId,
        action: dto.assignedToId ? HistoryAction.ASSIGNED : HistoryAction.UNASSIGNED,
        description: dto.assignedToId ? 'Responsável atribuído' : 'Responsável removido',
      });
    }

    if ('dueDate' in dto && dto.dueDate !== undefined) {
      entries.push({
        cardId: id, userId,
        action: HistoryAction.DUE_DATE_SET,
        description: 'Prazo atualizado',
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

  // ── Delete (soft) ─────────────────────────────────────────────────────────

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const card = await this.cardRepository.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Card not found');
    if (!await this.canAccessBoard(card.boardId, userId)) throw new ForbiddenException();

    await this.historyRepository.save(
      this.historyRepository.create({
        cardId: id,
        userId,
        action: HistoryAction.DELETED,
        description: 'Card movido para a lixeira',
      }),
    );

    await this.cardRepository.softDelete(id);
    this.boardGateway.notifyBoardUpdated(card.boardId, 'card-deleted');
    return { message: 'Card moved to trash' };
  }

  async findTrashed(boardId: string, userId: string): Promise<Card[]> {
    if (!await this.canAccessBoard(boardId, userId)) throw new ForbiddenException();
    return this.cardRepository.find({
      where: { boardId },
      withDeleted: true,
      relations: ['assignees', 'tags'],
      order: { deletedAt: 'DESC' },
    }).then((cards) => cards.filter((c) => c.deletedAt !== null));
  }

  async restore(id: string, userId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!card) throw new NotFoundException('Card not found');
    if (!card.deletedAt) throw new ForbiddenException('Card is not in trash');
    if (!await this.canAccessBoard(card.boardId, userId)) throw new ForbiddenException();

    await this.cardRepository.restore(id);

    await this.historyRepository.save(
      this.historyRepository.create({
        cardId: id,
        userId,
        action: HistoryAction.RESTORED,
        description: 'Card restaurado da lixeira',
      }),
    );

    this.boardGateway.notifyBoardUpdated(card.boardId, 'card-restored');
    return this.cardRepository.findOne({ where: { id }, relations: ['assignees', 'tags'] });
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  async createComment(cardId: string, dto: CreateCommentDto, userId: string): Promise<CardComment> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');
    if (!await this.canAccessBoard(card.boardId, userId)) throw new ForbiddenException();

    const comment = await this.commentRepository.save(
      this.commentRepository.create({ cardId, userId, content: dto.content }),
    );

    this.boardGateway.notifyBoardUpdated(card.boardId, 'comment-updated');
    return this.commentRepository.findOne({ where: { id: comment.id }, relations: ['user'] });
  }

  async deleteComment(commentId: string, userId: string): Promise<{ message: string }> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['card'],
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const board = await this.boardRepository.findOne({ where: { id: comment.card.boardId } });
    const isOwner = board?.ownerId === userId;
    if (comment.userId !== userId && !isOwner) throw new ForbiddenException();

    await this.commentRepository.remove(comment);
    this.boardGateway.notifyBoardUpdated(comment.card.boardId, 'comment-updated');
    return { message: 'Comment deleted' };
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

    const color = dto.color ?? '#6B7280';

    const tag = await this.tagRepository.save(
      this.tagRepository.create({ cardId, name: dto.name, color }),
    );

    // Upsert tag into board catalog (create if name+color combo doesn't exist yet)
    const existing = await this.boardTagRepository.findOne({
      where: { boardId: card.boardId, name: dto.name, color },
    });
    if (!existing) {
      await this.boardTagRepository.save(
        this.boardTagRepository.create({ boardId: card.boardId, name: dto.name, color }),
      );
    }

    await this.historyRepository.save(
      this.historyRepository.create({
        cardId, userId,
        action: HistoryAction.TAG_ADDED,
        description: `Tag "${dto.name}" adicionada`,
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
        description: `Arquivo "${file.originalname}" anexado`,
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

  // ── Assignees ─────────────────────────────────────────────────────────────

  async addAssignee(cardId: string, userId: string, actorId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['assignees'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (!await this.canAccessBoard(card.boardId, actorId)) throw new ForbiddenException();
    if (!await this.canAccessBoard(card.boardId, userId)) {
      throw new ForbiddenException('User is not a board member');
    }

    if (card.assignees.some((a) => a.id === userId)) return card;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    card.assignees = [...card.assignees, user];
    const saved = await this.cardRepository.save(card);

    await this.historyRepository.save(
      this.historyRepository.create({
        cardId, userId: actorId,
        action: HistoryAction.ASSIGNED,
        description: `${user.name} adicionado como responsável`,
      }),
    );

    this.boardGateway.notifyBoardUpdated(card.boardId, 'card-updated');

    void this.notificationsService.create(userId, 'card_assigned', {
      cardId: saved.id,
      cardTitle: saved.title,
      boardId: saved.boardId,
    });

    return saved;
  }

  async removeAssignee(cardId: string, userId: string, actorId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['assignees'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (!await this.canAccessBoard(card.boardId, actorId)) throw new ForbiddenException();

    const target = card.assignees.find((a) => a.id === userId);
    if (!target) return card;

    card.assignees = card.assignees.filter((a) => a.id !== userId);
    const saved = await this.cardRepository.save(card);

    await this.historyRepository.save(
      this.historyRepository.create({
        cardId, userId: actorId,
        action: HistoryAction.UNASSIGNED,
        description: `${target.name} removido dos responsáveis`,
      }),
    );

    this.boardGateway.notifyBoardUpdated(card.boardId, 'card-updated');
    return saved;
  }

  // ── Checklist ─────────────────────────────────────────────────────────────

  async createChecklistItem(cardId: string, dto: CreateChecklistItemDto): Promise<ChecklistItem> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    const count = await this.checklistRepository.count({ where: { cardId } });
    return this.checklistRepository.save(
      this.checklistRepository.create({ cardId, text: dto.text, position: count }),
    );
  }

  async updateChecklistItem(itemId: string, dto: UpdateChecklistItemDto): Promise<ChecklistItem> {
    const item = await this.checklistRepository.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Checklist item not found');
    Object.assign(item, dto);
    return this.checklistRepository.save(item);
  }

  async deleteChecklistItem(itemId: string): Promise<{ message: string }> {
    const item = await this.checklistRepository.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Checklist item not found');
    await this.checklistRepository.remove(item);
    return { message: 'Checklist item deleted' };
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
