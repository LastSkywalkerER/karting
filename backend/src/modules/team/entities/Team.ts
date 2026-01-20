import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RaceTeam } from '../../race/entities/RaceTeam';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @OneToMany(() => RaceTeam, (raceTeam) => raceTeam.team)
  raceTeams!: RaceTeam[];

  // Relations will be defined from the other side
  // karts: Kart[] - defined in Kart entity with @ManyToOne
}
