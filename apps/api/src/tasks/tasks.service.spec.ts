import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';

describe('TasksService', () => {
  let service: TasksService;
  let repo: Repository<Task>;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockUsersRepo = {
    findOne: jest.fn(),
  };

  const mockAudit = { log: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockRepo },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: AuditService, useValue: mockAudit as any },
      ],
    }).compile();

    service = module.get(TasksService);
    repo = module.get(getRepositoryToken(Task));
    jest.resetAllMocks();
  });

  it('Owner can update any task status', async () => {
    const user = { id: 'u1', role: 'Owner', organization: { id: 'org1' } } as User;
    const task = { id: 't1', organization: { id: 'org2' }, status: 'todo' } as unknown as Task;
    mockRepo.findOne.mockResolvedValue(task);
    mockRepo.save.mockResolvedValue({ ...task, status: 'done' });
    const result = await service.update(user, 't1', { status: 'done' });
    expect(result.status).toBe('done');
  });

  it('Viewer cannot delete task', async () => {
    const user = { id: 'u1', role: 'Viewer', organization: { id: 'org1' } } as User;
    const task = { id: 't1', organization: { id: 'org1' } } as unknown as Task;
    mockRepo.findOne.mockResolvedValue(task);
    await expect(service.remove(user, 't1')).rejects.toThrow();
  });

  it('Assignee can update status', async () => {
    const user = { id: 'assignee', role: 'Admin', organization: { id: 'org1' } } as User;
    const task = { id: 't1', organization: { id: 'org1' }, assignee: { id: 'assignee' }, status: 'todo' } as unknown as Task;
    mockRepo.findOne.mockResolvedValue(task);
    mockRepo.save.mockResolvedValue({ ...task, status: 'in-progress' });
    const result = await service.update(user, 't1', { status: 'in-progress'});
    expect(result.status).toBe('in-progress');
  });
});
