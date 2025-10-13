import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit.entity';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE || 'db.sqlite',
      entities: [User, Organization, Task, AuditLog],
      synchronize: false, 
      logging: false,
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
    }),
    AuthModule,
    UsersModule,
    TasksModule,
    AuditModule,
  ],
})
export class AppModule {}
