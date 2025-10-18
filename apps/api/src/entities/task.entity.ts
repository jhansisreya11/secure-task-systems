import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'varchar', default: 'todo' })
  status!: 'todo' | 'in-progress' | 'done';

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'SET NULL', nullable: true })
  createdBy?: User | null;

  @ManyToOne(() => Organization, (org) => org.tasks, { onDelete: 'CASCADE', nullable: true })
  organization?: Organization | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
