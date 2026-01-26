import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, Unique, Index } from 'typeorm';
import { Race } from './Race';
import { Team } from '../../team/entities/Team';

@Entity('race_teams')
@Unique('UQ_race_team_number', ['raceId', 'number'])
export class RaceTeam {
  @PrimaryColumn({ name: 'race_id', type: 'integer' })
  raceId!: number;

  @PrimaryColumn({ name: 'team_id', type: 'integer' })
  teamId!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  number!: string | null;

  // Sync fields
  @Column({ name: 'updated_at', type: 'bigint', default: () => "strftime('%s','now') * 1000" })
  @Index()
  updatedAt!: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', type: 'bigint', nullable: true })
  deletedAt!: number | null;

  @ManyToOne(() => Race, (race) => race.raceTeams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'race_id' })
  race!: Race;

  @ManyToOne(() => Team, (team) => team.raceTeams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;
}
