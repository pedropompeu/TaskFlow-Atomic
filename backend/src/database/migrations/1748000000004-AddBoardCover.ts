import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoardCover1748000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE boards
        ADD COLUMN cover_type  VARCHAR(10)  DEFAULT NULL,
        ADD COLUMN cover_value VARCHAR(500) DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE boards
        DROP COLUMN cover_type,
        DROP COLUMN cover_value
    `);
  }
}
