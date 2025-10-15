import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateTaskDto } from '@secure-task-system/data';
import { UpdateTaskDto } from '@secure-task-system/data';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly audit: AuditService,
  ) {}
  
  private isAdminOrOwner(user: User) {
    return user.role === 'Admin' || user.role === 'Owner';
  }

  async create(user: User, dto: CreateTaskDto) {
    if (user.role === 'Viewer') {
      throw new ForbiddenException('Viewers cannot create tasks');
    }

    const task: Task = this.repo.create({
      id: crypto.randomUUID(),
      title: dto.title,
      description: dto.description,
      status: (dto.status as 'todo' | 'in-progress' | 'done') || 'todo',
      organization: user.organization,
      createdBy: user, 
    });

    if (dto.assigneeId) {
      const assignee = await this.usersRepo.findOne({ where: { id: dto.assigneeId } });
      if (!assignee) throw new NotFoundException('Assignee not found');
      if (assignee.organization?.id !== user.organization?.id && !this.isAdminOrOwner(user)) {
        throw new ForbiddenException('Cannot assign user from a different organization');
      }
      task.assignee = assignee;
    }

    const saved: Task = await this.repo.save(task); 

    await this.audit.log(user.id, user.username, 'create_task', {
      taskId: saved.id,
      title: saved.title,
    });

    return saved;
  }

  async findAll(user: User): Promise<Task[]> {
    const tasks: Task[] = await this.repo.find({
      where: { organization: { id: user.organization.id } },
      order: { createdAt: 'DESC' },
    });

    await this.audit.log(user.id, user.username, 'list_tasks', { count: tasks.length });
    return tasks;
  }

  async findById(user: User, id: string): Promise<Task> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    if (task.organization.id !== user.organization.id && user.role !== 'Owner') {
      throw new ForbiddenException('Access to task denied');
    }

    await this.audit.log(user.id, user.username, 'view_task', { taskId: id });
    return task;
  }

  async update(user: User, id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    if (task.organization.id !== user.organization.id && user.role !== 'Owner') {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'Viewer') {
      throw new ForbiddenException('Viewers cannot edit tasks');
    }

    if (
      dto.status &&
      !(this.isAdminOrOwner(user) || user.id === task.assignee?.id)
    ) {
      throw new ForbiddenException('Only assignee, Admin, or Owner can update status');
    }

    if (dto.assigneeId) {
      if (!this.isAdminOrOwner(user)) {
        throw new ForbiddenException('Only Admin/Owner can reassign tasks');
      }
      const newAssignee = await this.usersRepo.findOne({ where: { id: dto.assigneeId } });
      if (!newAssignee) throw new NotFoundException('Assignee not found');

      if (
        newAssignee.organization?.id !== task.organization?.id &&
        user.role !== 'Owner'
      ) {
        throw new ForbiddenException('Cannot assign outside organization');
      }

      task.assignee = newAssignee;
    }

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status as 'todo' | 'in-progress' | 'done';

    const saved: Task = await this.repo.save(task);

    await this.audit.log(user.id, user.username, 'update_task', { taskId: saved.id });
    return saved;
  }

  async remove(user: User, id: string): Promise<{ deleted: boolean }> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    if (!this.isAdminOrOwner(user)) {
      throw new ForbiddenException('Only Admin/Owner can delete tasks');
    } 
    if (task.organization.id !== user.organization.id && user.role !== 'Owner') {
      throw new ForbiddenException('Access denied');
    }

    await this.repo.remove(task);
    await this.audit.log(user.id, user.username, 'delete_task', { taskId: id });
    return { deleted: true };
  }
}
