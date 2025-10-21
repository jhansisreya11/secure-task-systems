import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth/auth.service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      user: jest.fn(),
    } as any;

    mockRouter = {
      navigateByUrl: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call auth.login() on submit', () => {
    mockAuthService.login.mockReturnValue(of({ access_token: '123' }));
    component.username = 'admin';
    component.password = 'password';

    component.submit();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'password',
    });
  });

  it('should navigate to root after successful login', () => {
    mockAuthService.login.mockReturnValue(of({ access_token: '123' }));

    component.submit();

    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should show error message on failed login', () => {
    mockAuthService.login.mockReturnValue(throwError(() => new Error('Invalid')));

    component.submit();

    expect(component.error).toBe('Login failed');
  });

  it('should reset error before submitting', () => {
    component.error = 'Previous error';
    mockAuthService.login.mockReturnValue(of({ access_token: '123' }));

    component.submit();

    expect(component.error).toBe('');
  });
});
