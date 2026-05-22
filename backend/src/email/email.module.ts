import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../cards/entities/card.entity';
import { EMAIL_QUEUE, EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EmailDeadlineCron } from './email-deadline.cron';

@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
    TypeOrmModule.forFeature([Card]),
  ],
  providers: [EmailService, EmailProcessor, EmailDeadlineCron],
  exports: [EmailService],
})
export class EmailModule {}
