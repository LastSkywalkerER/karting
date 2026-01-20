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

  @Column({ name: 'entered_at', type: 'datetime' })
  enteredAt!: Date;

  @Column({ name: 'exited_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  exitedAt!: Date;

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
