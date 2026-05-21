import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1748000000000 implements MigrationInterface {
  name = 'InitialSchema1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE card_status_enum AS ENUM ('todo', 'in_progress', 'in_review', 'done')
    `);

    await queryRunner.query(`
      CREATE TYPE card_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent')
    `);

    await queryRunner.query(`
      CREATE TYPE history_action_enum AS ENUM (
        'created', 'moved', 'assigned', 'unassigned', 'updated',
        'attachment_added', 'tag_added', 'tag_removed', 'due_date_set'
      )
    `);

    // ── users ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "name"       VARCHAR(255) NOT NULL,
        "email"      VARCHAR(255) NOT NULL,
        "password"   VARCHAR(255) NOT NULL,
        "avatar"     VARCHAR(500),
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // ── boards ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "boards" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "title"       VARCHAR(255) NOT NULL,
        "description" TEXT,
        "owner_id"    UUID        NOT NULL,
        "created_at"  TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_boards" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boards_owner" FOREIGN KEY ("owner_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_boards_owner_id" ON "boards" ("owner_id")
    `);

    // ── cards ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "cards" (
        "id"          UUID                NOT NULL DEFAULT gen_random_uuid(),
        "board_id"    UUID                NOT NULL,
        "title"       VARCHAR(255)        NOT NULL,
        "description" TEXT,
        "status"      card_status_enum    NOT NULL DEFAULT 'todo',
        "priority"    card_priority_enum  NOT NULL DEFAULT 'medium',
        "assigned_to" UUID,
        "due_date"    TIMESTAMP,
        "position"    INTEGER             NOT NULL DEFAULT 0,
        "created_by"  UUID                NOT NULL,
        "created_at"  TIMESTAMP           NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP           NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cards" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cards_board" FOREIGN KEY ("board_id")
          REFERENCES "boards" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cards_assigned_to" FOREIGN KEY ("assigned_to")
          REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cards_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_cards_status"      ON "cards" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_cards_due_date"    ON "cards" ("due_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_cards_assigned_to" ON "cards" ("assigned_to")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_cards_board_id"    ON "cards" ("board_id")
    `);

    // ── card_history ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "card_history" (
        "id"          UUID                NOT NULL DEFAULT gen_random_uuid(),
        "card_id"     UUID                NOT NULL,
        "user_id"     UUID                NOT NULL,
        "from_status" card_status_enum,
        "to_status"   card_status_enum,
        "action"      history_action_enum NOT NULL,
        "description" TEXT,
        "created_at"  TIMESTAMP           NOT NULL DEFAULT now(),
        CONSTRAINT "PK_card_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_card_history_card" FOREIGN KEY ("card_id")
          REFERENCES "cards" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_card_history_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_card_history_card_id" ON "card_history" ("card_id")
    `);

    // ── card_tags ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "card_tags" (
        "id"      UUID         NOT NULL DEFAULT gen_random_uuid(),
        "card_id" UUID         NOT NULL,
        "name"    VARCHAR(100) NOT NULL,
        "color"   VARCHAR(20)  NOT NULL DEFAULT '#6B7280',
        CONSTRAINT "PK_card_tags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_card_tags_card" FOREIGN KEY ("card_id")
          REFERENCES "cards" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_card_tags_card_id" ON "card_tags" ("card_id")
    `);

    // ── attachments ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
        "card_id"       UUID         NOT NULL,
        "uploaded_by"   UUID         NOT NULL,
        "filename"      VARCHAR(255) NOT NULL,
        "original_name" VARCHAR(255) NOT NULL,
        "mime_type"     VARCHAR(100) NOT NULL,
        "size"          INTEGER      NOT NULL,
        "path"          VARCHAR(500) NOT NULL,
        "created_at"    TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attachments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attachments_card" FOREIGN KEY ("card_id")
          REFERENCES "cards" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attachments_uploader" FOREIGN KEY ("uploaded_by")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_attachments_card_id" ON "attachments" ("card_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "attachments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "card_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "card_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "boards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "history_action_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "card_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "card_status_enum"`);
  }
}
