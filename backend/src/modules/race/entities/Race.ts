import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
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

  @OneToMany(() => RaceTeam, (raceTeam) => raceTeam.race)
  raceTeams!: RaceTeam[];

  // Relations defined from the other side
  // karts: Kart[] - defined in Kart entity with @ManyToOne
  // pitlaneConfig: PitlaneConfig - defined in PitlaneConfig entity with @OneToOne
}
