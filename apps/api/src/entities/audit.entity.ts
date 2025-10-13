import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  actorUserId!: string;

  @Column()
  actorUsername!: string;

  @Column()
  action!: string;

  @Column('text', { nullable: true })
  metadata?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
