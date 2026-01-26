import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { Race } from '../../race/entities/Race';

@Entity('pitlane_configs')
export class PitlaneConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'race_id', type: 'int', unique: true })
  @Index()
  raceId!: number;

  @Column({ name: 'lines_count', type: 'int' })
  linesCount!: number;

  @Column({ name: 'queue_size', type: 'int' })
  queueSize!: number;

  // Sync fields
  @Column({ name: 'updated_at', type: 'bigint', default: () => "strftime('%s','now') * 1000" })
  @Index()
  updatedAt!: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', type: 'bigint', nullable: true })
  deletedAt!: number | null;

  @OneToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'race_id' })
  race!: Race;
}
