import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Board } from './board.entity';

@Entity('board_tags')
export class BoardTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_board_tags_board_id')
  @Column({ name: 'board_id' })
  boardId: string;

  @ManyToOne(() => Board, (board) => board.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, default: '#6B7280' })
  color: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
