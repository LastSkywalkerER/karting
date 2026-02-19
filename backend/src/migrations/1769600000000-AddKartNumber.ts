import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableUnique,
} from 'typeorm';

export class AddKartNumber1769600000000 implements MigrationInterface {
  name = 'AddKartNumber1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'karts',
      new TableColumn({
        name: 'number',
        type: 'integer',
        default: 1,
      })
    );

    // Assign sequential numbers per race (1, 2, 3...) for existing karts
    await queryRunner.query(`
      UPDATE karts SET number = (
        SELECT COUNT(*) FROM karts k2
        WHERE k2.race_id = karts.race_id AND k2.id <= karts.id
      )
    `);

    await queryRunner.createUniqueConstraint(
      'karts',
      new TableUnique({
        name: 'UQ_karts_race_number',
        columnNames: ['race_id', 'number'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('karts', 'UQ_karts_race_number');
    await queryRunner.dropColumn('karts', 'number');
  }
}
