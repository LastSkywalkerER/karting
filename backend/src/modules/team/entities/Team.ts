import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, Index } from 'typeorm';
import type { Race } from '../../race/entities/Race';
import type { Kart } from '../../kart/entities/Kart';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  number!: string;

  // Relations will be defined from the other side
  // races: Race[] - defined in Race entity with @ManyToMany
  // karts: Kart[] - defined in Kart entity with @ManyToOne
}
