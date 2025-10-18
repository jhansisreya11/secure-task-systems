import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '@secure-task-system/auth';
@Module({
  imports: [TypeOrmModule.forFeature([Task, User, Organization]), AuthModule],
  controllers: [TasksController],
  providers: [TasksService,  RolesGuard],
})
export class TasksModule {}
