import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';

import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';

describe('TasksService (org-scoped)', () => {
  let service: TasksService;

  const mockTasksRepo: Partial<Record<keyof Repository<Task>, jest.Mock>> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockUsersRepo: Partial<Record<keyof Repository<User>, jest.Mock>> = {
    findOne: jest.fn(),
  };
  const mockOrgsRepo: Partial<Record<keyof Repository<Organization>, jest.Mock>> = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockTasksRepo },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: getRepositoryToken(Organization), useValue: mockOrgsRepo },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  it('updates status within the same org', async () => {
    const task = {
      id: 1,
      title: 'T',
      description: 'D',
      status: 'todo',
      organization: { id: 10 },
    } as unknown as Task;

    mockTasksRepo.findOne!.mockResolvedValue(task);
    mockTasksRepo.save!.mockImplementation(async (t: Task) => t);

    const updated = await service.updateInOrg(10, 1, { status: 'done' as any });
    expect(updated.status).toBe('done');
    expect(mockTasksRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['createdBy', 'organization'],
    });
    expect(mockTasksRepo.save).toHaveBeenCalled();
  });

  it('throws ForbiddenException when deleting a task from another org', async () => {
    const otherOrgTask = {
      id: 2,
      organization: { id: 99 },
    } as unknown as Task;

    mockTasksRepo.findOne!.mockResolvedValue(otherOrgTask);

    await expect(service.deleteInOrg(10, 2)).rejects.toThrow(ForbiddenException);
    expect(mockTasksRepo.remove).not.toHaveBeenCalled();
  });

  it('findAllByOrg returns tasks for that org with ordering', async () => {
    const rows = [
      { id: 3, organization: { id: 10 } },
      { id: 4, organization: { id: 10 } },
    ] as unknown as Task[];

    mockTasksRepo.find!.mockResolvedValue(rows);

    const out = await service.findAllByOrg(10);
    expect(out).toHaveLength(2);
    expect(mockTasksRepo.find).toHaveBeenCalledWith({
      where: { organization: { id: 10 } },
      relations: ['createdBy', 'organization'],
      order: { createdAt: 'DESC' as any },
    });
  });
});
