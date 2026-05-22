import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly memberRepository: Repository<BoardMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  create(dto: CreateBoardDto, ownerId: string): Promise<Board> {
    const board = this.boardRepository.create({ ...dto, ownerId });
    return this.boardRepository.save(board);
  }

  async findAllForUser(userId: string): Promise<Board[]> {
    const owned = await this.boardRepository.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });

    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: ['board'],
    });
    const shared = memberships
      .map((m) => m.board)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const seen = new Set(owned.map((b) => b.id));
    return [...owned, ...shared.filter((b) => !seen.has(b.id))];
  }

  async findOne(id: string, userId: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['cards', 'cards.assignedTo', 'cards.tags'],
      order: { cards: { position: 'ASC' } },
    });
    if (!board) throw new NotFoundException('Board not found');
    await this.assertAccess(board, userId);
    return board;
  }

  async update(id: string, dto: UpdateBoardDto, userId: string): Promise<Board> {
    const board = await this.boardRepository.findOne({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException();
    Object.assign(board, dto);
    return this.boardRepository.save(board);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const board = await this.boardRepository.findOne({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException();
    await this.boardRepository.remove(board);
    return { message: 'Board deleted' };
  }

  // ── Members ───────────────────────────────────────────────────────────────

  async getMembers(boardId: string, userId: string) {
    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    await this.assertAccess(board, userId);

    const owner = await this.userRepository.findOne({
      where: { id: board.ownerId },
      select: ['id', 'name', 'email', 'avatar'],
    });

    const members = await this.memberRepository.find({
      where: { boardId },
      relations: ['user'],
    });

    return {
      owner: { id: owner!.id, name: owner!.name, email: owner!.email, avatar: owner!.avatar, role: 'owner' },
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role,
        memberId: m.id,
      })),
    };
  }

  async inviteMember(boardId: string, inviterId: string, email: string) {
    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== inviterId) throw new ForbiddenException();

    const target = await this.userRepository.findOne({ where: { email } });
    if (!target) throw new NotFoundException('Usuário não encontrado com esse e-mail');
    if (target.id === inviterId) throw new BadRequestException('Você já é o dono deste quadro');

    const exists = await this.memberRepository.findOne({ where: { boardId, userId: target.id } });
    if (exists) throw new ConflictException('Usuário já é membro deste quadro');

    await this.memberRepository.save(
      this.memberRepository.create({ boardId, userId: target.id, role: 'editor' }),
    );

    return { id: target.id, name: target.name, email: target.email, avatar: target.avatar, role: 'editor' };
  }

  async removeMember(boardId: string, ownerId: string, targetUserId: string) {
    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== ownerId) throw new ForbiddenException();

    const member = await this.memberRepository.findOne({ where: { boardId, userId: targetUserId } });
    if (!member) throw new NotFoundException('Membro não encontrado');
    await this.memberRepository.remove(member);
    return { message: 'Membro removido' };
  }

  async isMember(boardId: string, userId: string): Promise<boolean> {
    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (!board) return false;
    if (board.ownerId === userId) return true;
    const m = await this.memberRepository.findOne({ where: { boardId, userId } });
    return !!m;
  }

  private async assertAccess(board: Board, userId: string): Promise<void> {
    if (board.ownerId === userId) return;
    const m = await this.memberRepository.findOne({ where: { boardId: board.id, userId } });
    if (!m) throw new ForbiddenException();
  }
}
