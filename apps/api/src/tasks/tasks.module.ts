import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '@secure-task-system/auth';
import { AuditModule } from '../audit/audit.module';
@Module({
  imports: [TypeOrmModule.forFeature([Task, User, Organization]), AuthModule,  AuditModule,],
  controllers: [TasksController],
  providers: [TasksService,  RolesGuard],
  exports: [TasksService],
})
export class TasksModule {}
