import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Race } from '../../race/entities/Race';
import { Team } from '../../team/entities/Team';

@Entity('karts')
export class Kart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', default: 1 })
  status!: number;

  @Column({ name: 'race_id', type: 'int' })
  @Index()
  raceId!: number;

  @Column({ name: 'team_id', type: 'int', nullable: true })
  @Index()
  teamId!: number | null;

  @ManyToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'race_id' })
  race!: Race;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_id' })
  team!: Team | null;
}
