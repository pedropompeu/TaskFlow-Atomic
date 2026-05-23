import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { Board } from '../../boards/entities/board.entity';
import { User } from '../../users/entities/user.entity';
import { CardHistory } from './card-history.entity';
import { CardTag } from './card-tag.entity';
import { Attachment } from './attachment.entity';
import { CardComment } from './card-comment.entity';
import { CardStatus, CardPriority } from './card-enums';

export { CardStatus, CardPriority };

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'board_id' })
  boardId: string;

  @ManyToOne(() => Board, (board) => board.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index('idx_cards_status')
  @Column({
    type: 'enum',
    enum: CardStatus,
    default: CardStatus.TODO,
  })
  status: CardStatus;

  @Column({
    type: 'enum',
    enum: CardPriority,
    default: CardPriority.MEDIUM,
  })
  priority: CardPriority;

  @Index('idx_cards_assigned_to')
  @Column({ name: 'assigned_to', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, (user) => user.assignedCards, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Index('idx_cards_due_date')
  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ name: 'created_by' })
  createdById: string;

  @ManyToOne(() => User, (user) => user.createdCards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToMany(() => CardHistory, (history) => history.card, { cascade: true })
  history: CardHistory[];

  @OneToMany(() => CardTag, (tag) => tag.card, { cascade: true })
  tags: CardTag[];

  @OneToMany(() => Attachment, (attachment) => attachment.card, { cascade: true })
  attachments: Attachment[];

  @OneToMany(() => CardComment, (comment) => comment.card, { cascade: true })
  comments: CardComment[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'card_assignees',
    joinColumn: { name: 'card_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignees: User[];

  @Column({ name: 'accent_color', nullable: true, length: 7, default: null })
  accentColor: string | null;

  @Column({ name: 'deadline_reminder_sent_at', type: 'timestamp', nullable: true })
  deadlineReminderSentAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
