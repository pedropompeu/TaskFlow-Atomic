import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications1748000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
        "user_id"    UUID         NOT NULL,
        "type"       VARCHAR(50)  NOT NULL,
        "payload"    JSONB        NOT NULL DEFAULT '{}',
        "read"       BOOLEAN      NOT NULL DEFAULT false,
        "created_at" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_read" ON "notifications" ("user_id", "read")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
