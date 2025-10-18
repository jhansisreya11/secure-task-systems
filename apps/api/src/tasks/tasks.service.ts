import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';

type Status = 'todo' | 'in-progress' | 'done';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Organization) private orgsRepo: Repository<Organization>,
  ) {}

  async createWithOrg(args: {
    title: string;
    description?: string;
    status?: Status;
    createdByUserId: string | number;
    orgId: string | number;
  }) {
    const userId = Number(args.createdByUserId);
    const orgIdNum = Number(args.orgId);

    const [user, org] = await Promise.all([
      this.usersRepo.findOne({ where: { id: userId }, relations: ['organization'] }),
      this.orgsRepo.findOne({ where: { id: orgIdNum } }),
    ]);

    if (!user || !org) throw new ForbiddenException('Invalid user or organization');

    const task = this.tasksRepo.create({
      title: args.title,
      description: args.description,
      status: args.status ?? 'todo',
      createdBy: user,
      organization: org,
    });
    return this.tasksRepo.save(task);
  }

  async findAllByOrg(orgId: string | number) {
    const orgIdNum = Number(orgId);
    return this.tasksRepo.find({
      where: { organization: { id: orgIdNum } },
      relations: ['createdBy', 'organization'],
      order: { createdAt: 'DESC' as any },
    });
  }

  async findById(id: string | number) {
    const idNum = Number(id);
    return this.tasksRepo.findOne({
      where: { id: idNum },
      relations: ['createdBy', 'organization'],
    });
  }

  async findByIdScoped(orgId: string | number, id: string | number) {
    const orgIdNum = Number(orgId);
    const t = await this.findById(id);
    if (!t) throw new NotFoundException();
    if (!t.organization || t.organization.id !== orgIdNum) throw new ForbiddenException();
    return t;
  }

  async updateInOrg(
    orgId: string | number,
    id: string | number,
    updates: Partial<Pick<Task, 'title' | 'description' | 'status'>>,
  ) {
    const task = await this.findByIdScoped(orgId, id);
    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.status !== undefined) task.status = updates.status as Status;
    return this.tasksRepo.save(task);
  }

  async deleteInOrg(orgId: string | number, id: string | number) {
    const task = await this.findByIdScoped(orgId, id);
    await this.tasksRepo.remove(task);
    return { deleted: true };
  }
}
