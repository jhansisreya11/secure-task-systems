import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Organization } from './organization.entity';
import { Task } from './task.entity';

export type Role = 'Owner' | 'Admin' | 'Viewer';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;   

  @Column({ type: 'text', default: 'Viewer' })
  role!: Role;

  @ManyToOne(() => Organization, (org) => org.users, { onDelete: 'SET NULL', nullable: true })
organization!: Organization | null;


  @OneToMany(() => Task, (task) => task.createdBy)
  tasks!: Task[];
}
