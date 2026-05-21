import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  create(dto: CreateBoardDto, ownerId: string): Promise<Board> {
    const board = this.boardRepository.create({ ...dto, ownerId });
    return this.boardRepository.save(board);
  }

  findAllByOwner(ownerId: string): Promise<Board[]> {
    return this.boardRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['cards', 'cards.assignedTo', 'cards.tags'],
      order: { cards: { position: 'ASC' } },
    });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== ownerId) throw new ForbiddenException();
    return board;
  }

  async update(id: string, dto: UpdateBoardDto, ownerId: string): Promise<Board> {
    const board = await this.findOne(id, ownerId);
    Object.assign(board, dto);
    return this.boardRepository.save(board);
  }

  async remove(id: string, ownerId: string): Promise<{ message: string }> {
    const board = await this.findOne(id, ownerId);
    await this.boardRepository.remove(board);
    return { message: 'Board deleted' };
  }
}
