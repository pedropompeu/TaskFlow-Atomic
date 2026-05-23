import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCardAccentColor1748000000006 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cards',
      new TableColumn({
        name: 'accent_color',
        type: 'varchar',
        length: '7',
        isNullable: true,
        default: null,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cards', 'accent_color');
  }
}
