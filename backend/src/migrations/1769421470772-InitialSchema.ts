import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique, TableForeignKey } from 'typeorm';

export class InitialSchema1769421470772 implements MigrationInterface {
  name = 'InitialSchema1769421470772';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create teams table
    await queryRunner.createTable(
      new Table({
        name: 'teams',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'updated_at',
            type: 'bigint',
            default: "strftime('%s','now') * 1000",
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deleted_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'teams',
      new TableIndex({
        name: 'IDX_teams_updated_at',
        columnNames: ['updated_at'],
      })
    );

    // Create races table
    await queryRunner.createTable(
      new Table({
        name: 'races',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'updated_at',
            type: 'bigint',
            default: "strftime('%s','now') * 1000",
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deleted_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'races',
      new TableIndex({
        name: 'IDX_races_updated_at',
        columnNames: ['updated_at'],
      })
    );

    // Create race_teams table
    await queryRunner.createTable(
      new Table({
        name: 'race_teams',
        columns: [
          {
            name: 'race_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'team_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'bigint',
            default: "strftime('%s','now') * 1000",
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deleted_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'race_teams',
      new TableIndex({
        name: 'IDX_race_teams_updated_at',
        columnNames: ['updated_at'],
      })
    );

    await queryRunner.createIndex(
      'race_teams',
      new TableIndex({
        name: 'IDX_race_teams_race_id',
        columnNames: ['race_id'],
      })
    );

    await queryRunner.createUniqueConstraint(
      'race_teams',
      new TableUnique({
        name: 'UQ_race_team_number',
        columnNames: ['race_id', 'number'],
      })
    );

    await queryRunner.createForeignKey(
      'race_teams',
      new TableForeignKey({
        columnNames: ['race_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'races',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'race_teams',
      new TableForeignKey({
        columnNames: ['team_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'CASCADE',
      })
    );

    // Create karts table
    await queryRunner.createTable(
      new Table({
        name: 'karts',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'status',
            type: 'int',
            default: 1,
          },
          {
            name: 'race_id',
            type: 'int',
          },
          {
            name: 'team_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'bigint',
            default: "strftime('%s','now') * 1000",
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deleted_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'karts',
      new TableIndex({
        name: 'IDX_karts_race_id',
        columnNames: ['race_id'],
      })
    );

    await queryRunner.createIndex(
      'karts',
      new TableIndex({
        name: 'IDX_karts_team_id',
        columnNames: ['team_id'],
      })
    );

    await queryRunner.createIndex(
      'karts',
      new TableIndex({
        name: 'IDX_karts_updated_at',
        columnNames: ['updated_at'],
      })
    );

    await queryRunner.createForeignKey(
      'karts',
      new TableForeignKey({
        columnNames: ['race_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'races',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'karts',
      new TableForeignKey({
        columnNames: ['team_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'SET NULL',
      })
    );

    // Create pitlane_configs table
    await queryRunner.createTable(
      new Table({
        name: 'pitlane_configs',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'race_id',
            type: 'int',
            isUnique: true,
          },
          {
            name: 'lines_count',
            type: 'int',
          },
          {
            name: 'queue_size',
            type: 'int',
          },
          {
            name: 'updated_at',
            type: 'bigint',
            default: "strftime('%s','now') * 1000",
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deleted_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'pitlane_configs',
      new TableIndex({
        name: 'IDX_pitlane_configs_race_id',
        columnNames: ['race_id'],
      })
    );

    await queryRunner.createIndex(
      'pitlane_configs',
      new TableIndex({
        name: 'IDX_pitlane_configs_updated_at',
        columnNames: ['updated_at'],
      })
    );

    await queryRunner.createForeignKey(
      'pitlane_configs',
      new TableForeignKey({
        columnNames: ['race_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'races',
        onDelete: 'CASCADE',
      })
    );

    // Create pitlane_current table
    await queryRunner.createTable(
      new Table({
        name: 'pitlane_current',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'pitlane_config_id',
            type: 'int',
          },
          {
            name: 'team_id',
            type: 'int',
          },
          {
            name: 'kart_id',
            type: 'int',
          },
          {
            name: 'line_number',
            type: 'int',
          },
          {
            name: 'queue_position',
            type: 'int',
          },
          {
            name: 'entered_at',
            type: 'bigint',
          },
          {
            name: 'updated_at',
            type: 'bigint',
            default: "strftime('%s','now') * 1000",
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deleted_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'pitlane_current',
      new TableIndex({
        name: 'IDX_pitlane_current_pitlane_config_id',
        columnNames: ['pitlane_config_id'],
      })
    );

    await queryRunner.createIndex(
      'pitlane_current',
      new TableIndex({
        name: 'IDX_pitlane_current_line_number',
        columnNames: ['line_number'],
      })
    );

    await queryRunner.createIndex(
      'pitlane_current',
      new TableIndex({
        name: 'IDX_pitlane_current_updated_at',
        columnNames: ['updated_at'],
      })
    );

    await queryRunner.createUniqueConstraint(
      'pitlane_current',
      new TableUnique({
        name: 'UQ_pitlane_current_config_line_queue',
        columnNames: ['pitlane_config_id', 'line_number', 'queue_position'],
      })
    );

    await queryRunner.createForeignKey(
      'pitlane_current',
      new TableForeignKey({
        columnNames: ['pitlane_config_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pitlane_configs',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'pitlane_current',
      new TableForeignKey({
        columnNames: ['team_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'pitlane_current',
      new TableForeignKey({
        columnNames: ['kart_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'karts',
        onDelete: 'CASCADE',
      })
    );

    // Create pitlane_history table
    await queryRunner.createTable(
      new Table({
        name: 'pitlane_history',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'pitlane_config_id',
            type: 'int',
          },
          {
            name: 'team_id',
            type: 'int',
          },
          {
            name: 'kart_id',
            type: 'int',
          },
          {
            name: 'line_number',
            type: 'int',
          },
          {
            name: 'queue_position',
            type: 'int',
          },
          {
            name: 'entered_at',
            type: 'bigint',
          },
          {
            name: 'exited_at',
            type: 'bigint',
          },
          {
            name: 'updated_at',
            type: 'bigint',
            default: "strftime('%s','now') * 1000",
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deleted_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'pitlane_history',
      new TableIndex({
        name: 'IDX_pitlane_history_pitlane_config_id',
        columnNames: ['pitlane_config_id'],
      })
    );

    await queryRunner.createIndex(
      'pitlane_history',
      new TableIndex({
        name: 'IDX_pitlane_history_line_number',
        columnNames: ['line_number'],
      })
    );

    await queryRunner.createIndex(
      'pitlane_history',
      new TableIndex({
        name: 'IDX_pitlane_history_updated_at',
        columnNames: ['updated_at'],
      })
    );

    await queryRunner.createForeignKey(
      'pitlane_history',
      new TableForeignKey({
        columnNames: ['pitlane_config_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pitlane_configs',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'pitlane_history',
      new TableForeignKey({
        columnNames: ['team_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'pitlane_history',
      new TableForeignKey({
        columnNames: ['kart_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'karts',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.dropTable('pitlane_history', true);
    await queryRunner.dropTable('pitlane_current', true);
    await queryRunner.dropTable('pitlane_configs', true);
    await queryRunner.dropTable('karts', true);
    await queryRunner.dropTable('race_teams', true);
    await queryRunner.dropTable('races', true);
    await queryRunner.dropTable('teams', true);
  }
}
