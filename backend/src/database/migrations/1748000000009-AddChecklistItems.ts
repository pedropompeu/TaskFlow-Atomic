import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddChecklistItems1748000000009 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'checklist_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'card_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'text',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'done',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'position',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['card_id'],
            referencedTableName: 'cards',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'checklist_items',
      new TableIndex({
        name: 'idx_checklist_items_card_id',
        columnNames: ['card_id'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('checklist_items');
  }
}
