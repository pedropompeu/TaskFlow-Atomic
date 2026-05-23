import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../cards/entities/card.entity';
import { CardHistory } from '../cards/entities/card-history.entity';
import { Board } from '../boards/entities/board.entity';
import { BoardMember } from '../boards/entities/board-member.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Card, CardHistory, Board, BoardMember])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
