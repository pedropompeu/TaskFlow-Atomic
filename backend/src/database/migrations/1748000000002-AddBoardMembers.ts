import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoardMembers1748000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "board_members" (
        "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
        "board_id"   UUID         NOT NULL,
        "user_id"    UUID         NOT NULL,
        "role"       VARCHAR(20)  NOT NULL DEFAULT 'editor',
        "created_at" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_board_members_board_user" UNIQUE ("board_id", "user_id"),
        CONSTRAINT "FK_board_members_board" FOREIGN KEY ("board_id")
          REFERENCES "boards" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_board_members_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_board_members_board_id" ON "board_members" ("board_id")`);
    await queryRunner.query(`CREATE INDEX "idx_board_members_user_id" ON "board_members" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "board_members"`);
  }
}
