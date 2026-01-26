import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { RaceTeam } from './RaceTeam';
import type { Kart } from '../../kart/entities/Kart';
import type { PitlaneConfig } from '../../pitlane/entities/PitlaneConfig';

@Entity('races')
export class Race {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'date' })
  date!: string;

  // Sync fields
  @Column({ name: 'updated_at', type: 'bigint', default: () => "strftime('%s','now') * 1000" })
  @Index()
  updatedAt!: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', type: 'bigint', nullable: true })
  deletedAt!: number | null;

  @OneToMany(() => RaceTeam, (raceTeam) => raceTeam.race)
  raceTeams!: RaceTeam[];

  // Relations defined from the other side
  // karts: Kart[] - defined in Kart entity with @ManyToOne
  // pitlaneConfig: PitlaneConfig - defined in PitlaneConfig entity with @OneToOne
}
