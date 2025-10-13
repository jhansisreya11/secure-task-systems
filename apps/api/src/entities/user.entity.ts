import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';

export type Role = 'Owner' | 'Admin' | 'Viewer';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'text' })
  role!: Role;

  @ManyToOne(() => Organization, (o) => o.users, { eager: true })
  organization!: Organization;

  @CreateDateColumn()
  createdAt!: Date;
}
