import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSpeedhiveUrlToRaces1769500000000 implements MigrationInterface {
  name = 'AddSpeedhiveUrlToRaces1769500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'races',
      new TableColumn({
        name: 'speedhive_url',
        type: 'varchar',
        length: '512',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('races', 'speedhive_url');
  }
}
