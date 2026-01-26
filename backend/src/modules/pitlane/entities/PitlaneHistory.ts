import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PitlaneConfig } from './PitlaneConfig';
import { Team } from '../../team/entities/Team';
import { Kart } from '../../kart/entities/Kart';

@Entity('pitlane_history')
export class PitlaneHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'pitlane_config_id', type: 'int' })
  @Index()
  pitlaneConfigId!: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId!: number;

  @Column({ name: 'kart_id', type: 'int' })
  kartId!: number;

  @Column({ name: 'line_number', type: 'int' })
  @Index()
  lineNumber!: number;

  @Column({ name: 'queue_position', type: 'int' })
  queuePosition!: number;

  @Column({ name: 'entered_at', type: 'bigint' })
  enteredAt!: number;

  @Column({ name: 'exited_at', type: 'bigint' })
  exitedAt!: number;

  // Sync fields
  @Column({ name: 'updated_at', type: 'bigint', default: () => "strftime('%s','now') * 1000" })
  @Index()
  updatedAt!: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', type: 'bigint', nullable: true })
  deletedAt!: number | null;

  @ManyToOne(() => PitlaneConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pitlane_config_id' })
  pitlaneConfig!: PitlaneConfig;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => Kart, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kart_id' })
  kart!: Kart;
}
