import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { EmailJobPayload } from './email.types';

export const EMAIL_QUEUE = 'email';

@Injectable()
export class EmailService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly queue: Queue) {}

  async enqueue(payload: EmailJobPayload): Promise<void> {
    await this.queue.add(payload.type, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }
}
