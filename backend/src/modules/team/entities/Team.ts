import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { RaceTeam } from '../../race/entities/RaceTeam';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  // Sync fields
  @Column({ name: 'updated_at', type: 'bigint', default: () => "strftime('%s','now') * 1000" })
  @Index()
  updatedAt!: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', type: 'bigint', nullable: true })
  deletedAt!: number | null;

  @OneToMany(() => RaceTeam, (raceTeam) => raceTeam.team)
  raceTeams!: RaceTeam[];

  // Relations will be defined from the other side
  // karts: Kart[] - defined in Kart entity with @ManyToOne
}
