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

  @OneToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'race_id' })
  race!: Race;
}
