import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardAssignees1748000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "card_assignees" (
        "card_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        CONSTRAINT "PK_card_assignees" PRIMARY KEY ("card_id", "user_id"),
        CONSTRAINT "FK_card_assignees_card" FOREIGN KEY ("card_id")
          REFERENCES "cards"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_card_assignees_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO card_assignees (card_id, user_id)
      SELECT id, assigned_to FROM cards
      WHERE assigned_to IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "card_assignees"`);
  }
}
