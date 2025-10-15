import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import {ConfigModule} from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit.entity';
import { HealthController } from './health.controller';
import { RolesGuard } from '@secure-task-system/auth';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const dbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH ?? 'apps/api/db.sqlite'
);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'], 
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: dbPath,
      autoLoadEntities: true,
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
  controllers: [HealthController],
})
export class AppModule {
  constructor() {
    console.log('[Nest] DB file ->', dbPath);
  }
}
