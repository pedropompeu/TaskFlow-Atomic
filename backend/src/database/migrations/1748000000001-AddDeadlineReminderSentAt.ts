import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeadlineReminderSentAt1748000000001 implements MigrationInterface {
  name = 'AddDeadlineReminderSentAt1748000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cards"
      ADD COLUMN IF NOT EXISTS "deadline_reminder_sent_at" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cards"
      DROP COLUMN IF EXISTS "deadline_reminder_sent_at"
    `);
  }
}
