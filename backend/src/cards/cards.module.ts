import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { CardHistory } from './entities/card-history.entity';
import { CardTag } from './entities/card-tag.entity';
import { Attachment } from './entities/attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card, CardHistory, CardTag, Attachment])],
  exports: [TypeOrmModule],
})
export class CardsModule {}
