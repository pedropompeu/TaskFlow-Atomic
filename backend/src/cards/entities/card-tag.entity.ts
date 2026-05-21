import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Card } from './card.entity';

@Entity('card_tags')
export class CardTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_card_tags_card_id')
  @Column({ name: 'card_id' })
  cardId: string;

  @ManyToOne(() => Card, (card) => card.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, default: '#6B7280' })
  color: string;
}
