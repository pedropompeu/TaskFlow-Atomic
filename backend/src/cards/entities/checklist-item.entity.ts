import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Card } from './card.entity';

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_checklist_items_card_id')
  @Column({ name: 'card_id' })
  cardId: string;

  @ManyToOne(() => Card, (card) => card.checklists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column({ length: 500 })
  text: string;

  @Column({ default: false })
  done: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
