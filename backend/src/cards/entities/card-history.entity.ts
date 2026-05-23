import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Card } from './card.entity';
import { CardStatus } from './card-enums';
import { User } from '../../users/entities/user.entity';

export enum HistoryAction {
  CREATED = 'created',
  MOVED = 'moved',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  UPDATED = 'updated',
  ATTACHMENT_ADDED = 'attachment_added',
  TAG_ADDED = 'tag_added',
  TAG_REMOVED = 'tag_removed',
  DUE_DATE_SET = 'due_date_set',
  DELETED = 'deleted',
  RESTORED = 'restored',
}

@Entity('card_history')
export class CardHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_card_history_card_id')
  @Column({ name: 'card_id' })
  cardId: string;

  @ManyToOne(() => Card, (card) => card.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.cardHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: CardStatus,
    nullable: true,
  })
  fromStatus: CardStatus;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: CardStatus,
    nullable: true,
  })
  toStatus: CardStatus;

  @Column({ type: 'enum', enum: HistoryAction })
  action: HistoryAction;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
