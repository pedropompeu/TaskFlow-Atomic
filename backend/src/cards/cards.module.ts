import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { CardHistory } from './entities/card-history.entity';
import { CardTag } from './entities/card-tag.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { Attachment } from './entities/attachment.entity';
import { CardComment } from './entities/card-comment.entity';
import { Board } from '../boards/entities/board.entity';
import { BoardMember } from '../boards/entities/board-member.entity';
import { BoardTag } from '../boards/entities/board-tag.entity';
import { User } from '../users/entities/user.entity';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { AttachmentsController } from './attachments.controller';
import { BoardGateway } from './board.gateway';
import { CardTrashPurgeCron } from './card-trash-purge.cron';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, CardHistory, CardTag, ChecklistItem, Attachment, CardComment, Board, BoardMember, BoardTag, User]),
    EmailModule,
    NotificationsModule,
  ],
  controllers: [CardsController, AttachmentsController],
  providers: [CardsService, BoardGateway, CardTrashPurgeCron],
  exports: [TypeOrmModule, CardsService, BoardGateway],
})
export class CardsModule {}
