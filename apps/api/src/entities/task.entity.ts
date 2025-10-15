import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'todo' })
  status!: 'todo' | 'in-progress' | 'done';

  @ManyToOne(() => Organization, (org) => org.tasks, { eager: true })
  organization!: Organization;

  @ManyToOne(() => User, { eager: true })
  createdBy!: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  assignee?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
