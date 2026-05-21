import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { CardHistory } from './entities/card-history.entity';
import { CardTag } from './entities/card-tag.entity';
import { Attachment } from './entities/attachment.entity';
import { Board } from '../boards/entities/board.entity';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Card, CardHistory, CardTag, Attachment, Board])],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [TypeOrmModule, CardsService],
})
export class CardsModule {}
