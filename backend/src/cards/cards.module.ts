import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { CardHistory } from './entities/card-history.entity';
import { CardTag } from './entities/card-tag.entity';
import { Attachment } from './entities/attachment.entity';
import { Board } from '../boards/entities/board.entity';
import { BoardMember } from '../boards/entities/board-member.entity';
import { User } from '../users/entities/user.entity';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { AttachmentsController } from './attachments.controller';
import { BoardGateway } from './board.gateway';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, CardHistory, CardTag, Attachment, Board, BoardMember, User]),
    EmailModule,
    NotificationsModule,
  ],
  controllers: [CardsController, AttachmentsController],
  providers: [CardsService, BoardGateway],
  exports: [TypeOrmModule, CardsService, BoardGateway],
})
export class CardsModule {}
