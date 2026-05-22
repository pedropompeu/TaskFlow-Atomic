import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { User } from '../users/entities/user.entity';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Board, BoardMember, User]), NotificationsModule],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [TypeOrmModule, BoardsService],
})
export class BoardsModule {}
