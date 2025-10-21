import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TasksComponent } from './tasks.component';
import { TaskService } from './task.service';
import { AuthService } from '../../core/auth/auth.service';
import { of } from 'rxjs';
import { Task } from './task.service'; 

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    mockTaskService = {
      list: jest.fn().mockReturnValue(of([])),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<TaskService>;

    mockAuthService = {
      user: jest.fn().mockReturnValue({ username: 'testuser', role: 'Admin' }),
      logout: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    expect(mockTaskService.list).toHaveBeenCalled();
  });

  it('should call create() on TaskService', () => {
    const newTask: Task = { id: 1, title: 'New Task', status: 'todo' };
    mockTaskService.create.mockReturnValue(of(newTask));

    component.title = 'New Task';
    component.description = 'Desc';
    component.create();

    expect(mockTaskService.create).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'Desc',
      status: 'todo',
      done: false,
    });
  });

  it('should call remove() on TaskService', () => {
    const t: Task = { id: 1, title: 'Delete Me', status: 'todo' };
    mockTaskService.remove.mockReturnValue(of(void 0));
    component.remove(t);
    expect(mockTaskService.remove).toHaveBeenCalledWith(1);
  });

  it('should allow editing for Admin', () => {
    mockAuthService.user.mockReturnValue({ role: 'Admin', username: 'admin' });
    expect(component.canEdit()).toBe(true);
  });
});
