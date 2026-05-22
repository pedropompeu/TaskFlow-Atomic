import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { EMAIL_QUEUE } from './email.service';
import type {
  CardAssignedPayload,
  DeadlineReminderPayload,
  EmailJobPayload,
  StatusChangedPayload,
} from './email.types';

const STATUS_LABEL: Record<string, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  in_review: 'Em Revisão',
  done: 'Concluído',
};

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.from = configService.get('MAIL_FROM', '"TaskFlow" <noreply@taskflow.app>');
    this.transporter = nodemailer.createTransport({
      host: configService.get('MAIL_HOST', 'sandbox.smtp.mailtrap.io'),
      port: configService.get<number>('MAIL_PORT', 2525),
      auth: {
        user: configService.get('MAIL_USER', ''),
        pass: configService.get('MAIL_PASS', ''),
      },
    });
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    this.logger.log(`Processing email job: ${job.name} (id=${job.id})`);
    try {
      switch (job.data.type) {
        case 'card_assigned':
          await this.sendAssigned(job.data);
          break;
        case 'status_changed':
          await this.sendStatusChanged(job.data);
          break;
        case 'deadline_reminder':
          await this.sendDeadlineReminder(job.data);
          break;
      }
      this.logger.log(`Email sent for job ${job.id}`);
    } catch (err) {
      this.logger.error(`Failed to send email for job ${job.id}`, err);
      throw err;
    }
  }

  private async sendAssigned(data: CardAssignedPayload): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: data.assigneeEmail,
      subject: `[TaskFlow] Card atribuído a você: ${data.cardTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#1D4ED8;margin-bottom:8px">Card atribuído</h2>
          <p style="color:#374151">Olá <strong>${data.assigneeName}</strong>,</p>
          <p style="color:#374151">
            Um card foi atribuído a você no board <strong>${data.boardTitle}</strong>.
          </p>
          <div style="background:#F3F4F6;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0;font-size:18px;font-weight:bold;color:#111827">${data.cardTitle}</p>
          </div>
          <p style="color:#6B7280;font-size:13px">Acesse o TaskFlow para ver os detalhes.</p>
        </div>
      `,
    });
  }

  private async sendStatusChanged(data: StatusChangedPayload): Promise<void> {
    const from = STATUS_LABEL[data.fromStatus] ?? data.fromStatus;
    const to = STATUS_LABEL[data.toStatus] ?? data.toStatus;

    await this.transporter.sendMail({
      from: this.from,
      to: data.assigneeEmail,
      subject: `[TaskFlow] Status atualizado: ${data.cardTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#1D4ED8;margin-bottom:8px">Status atualizado</h2>
          <p style="color:#374151">Olá <strong>${data.assigneeName}</strong>,</p>
          <p style="color:#374151">O status do card abaixo foi alterado.</p>
          <div style="background:#F3F4F6;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">${data.cardTitle}</p>
            <p style="margin:0;color:#6B7280;font-size:14px">
              <span style="color:#EF4444">${from}</span>
              &nbsp;→&nbsp;
              <span style="color:#10B981">${to}</span>
            </p>
          </div>
          <p style="color:#6B7280;font-size:13px">Acesse o TaskFlow para ver os detalhes.</p>
        </div>
      `,
    });
  }

  private async sendDeadlineReminder(data: DeadlineReminderPayload): Promise<void> {
    const due = new Date(data.dueDate).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    await this.transporter.sendMail({
      from: this.from,
      to: data.assigneeEmail,
      subject: `[TaskFlow] Prazo se aproximando: ${data.cardTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#D97706;margin-bottom:8px">⏰ Prazo em menos de 24 horas</h2>
          <p style="color:#374151">Olá <strong>${data.assigneeName}</strong>,</p>
          <p style="color:#374151">
            O prazo de um card atribuído a você está se aproximando.
          </p>
          <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0 0 6px;font-size:18px;font-weight:bold;color:#111827">${data.cardTitle}</p>
            <p style="margin:0;color:#92400E;font-size:14px">Prazo: <strong>${due}</strong></p>
          </div>
          <p style="color:#6B7280;font-size:13px">Acesse o TaskFlow para concluir a tarefa a tempo.</p>
        </div>
      `,
    });
  }
}
