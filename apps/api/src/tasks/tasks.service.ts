import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    private audit: AuditService,
  ) {}

  // Explicitly type `data` as Partial<Task> is fine, but we tell TS that saved will be a single Task
  async create(user: User, data: Partial<Task>): Promise<Task> {
    if (user.role === 'Viewer') {
      throw new ForbiddenException('Viewers cannot create tasks');
    }

    const task: Task = this.repo.create({
      title: data.title,
      description: data.description,
      status: (data.status as 'todo' | 'in-progress' | 'done') || 'todo',
      organization: user.organization,
      createdBy: user, 
    });

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

  async update(user: User, id: string, updates: Partial<Task>): Promise<Task> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    if (task.organization.id !== user.organization.id && user.role !== 'Owner') {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'Viewer') {
      throw new ForbiddenException('Viewers cannot edit tasks');
    }

    task.title = updates.title ?? task.title;
    task.description = updates.description ?? task.description;
    if (updates.status) {
      task.status = updates.status as 'todo' | 'in-progress' | 'done';
    }

    const saved: Task = await this.repo.save(task);

    await this.audit.log(user.id, user.username, 'update_task', { taskId: saved.id });
    return saved;
  }

  async remove(user: User, id: string): Promise<{ deleted: boolean }> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    if (task.organization.id !== user.organization.id && user.role !== 'Owner') {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'Viewer') {
      throw new ForbiddenException('Viewers cannot delete tasks');
    }

    await this.repo.remove(task);
    await this.audit.log(user.id, user.username, 'delete_task', { taskId: id });
    return { deleted: true };
  }
}
