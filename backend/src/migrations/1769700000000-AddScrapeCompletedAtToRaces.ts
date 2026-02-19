import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddScrapeCompletedAtToRaces1769700000000 implements MigrationInterface {
  name = 'AddScrapeCompletedAtToRaces1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'races',
      new TableColumn({
        name: 'scrape_completed_at',
        type: 'bigint',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('races', 'scrape_completed_at');
  }
}
