import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, OneToOne } from 'typeorm';
import { Team } from '../../team/entities/Team';
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

  @ManyToMany(() => Team, { eager: false })
  @JoinTable({
    name: 'race_teams',
    joinColumn: { name: 'race_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'team_id', referencedColumnName: 'id' }
  })
  teams!: Team[];

  // Relations defined from the other side
  // karts: Kart[] - defined in Kart entity with @ManyToOne
  // pitlaneConfig: PitlaneConfig - defined in PitlaneConfig entity with @OneToOne
}
