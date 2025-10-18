import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'apps/api/db.sqlite',
      entities: [User, Organization, Task],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UsersModule,
    TasksModule,
  ],
  controllers: [HealthController],   // 👈 add this line
})
export class AppModule {}
