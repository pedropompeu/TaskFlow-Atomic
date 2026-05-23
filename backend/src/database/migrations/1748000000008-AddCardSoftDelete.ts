import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCardSoftDelete1748000000008 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cards',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.query(
      `ALTER TYPE history_action_enum ADD VALUE IF NOT EXISTS 'deleted'`,
    );
    await queryRunner.query(
      `ALTER TYPE history_action_enum ADD VALUE IF NOT EXISTS 'restored'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cards', 'deleted_at');
  }
}
