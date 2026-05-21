import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Board } from '../../boards/entities/board.entity';
import { Card } from '../../cards/entities/card.entity';
import { CardHistory } from '../../cards/entities/card-history.entity';
import { Attachment } from '../../cards/entities/attachment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ nullable: true, length: 500 })
  avatar: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Board, (board) => board.owner)
  boards: Board[];

  @OneToMany(() => Card, (card) => card.assignedTo)
  assignedCards: Card[];

  @OneToMany(() => Card, (card) => card.createdBy)
  createdCards: Card[];

  @OneToMany(() => CardHistory, (history) => history.user)
  cardHistories: CardHistory[];

  @OneToMany(() => Attachment, (attachment) => attachment.uploadedBy)
  attachments: Attachment[];
}
