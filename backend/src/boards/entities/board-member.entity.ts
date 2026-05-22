import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Board } from './board.entity';
import { User } from '../../users/entities/user.entity';

@Entity('board_members')
@Unique(['boardId', 'userId'])
export class BoardMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'board_id' })
  boardId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 20, default: 'editor' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
