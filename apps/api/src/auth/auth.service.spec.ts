import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import type { Role } from '@secure-task-system/data';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockOrganization = (): Organization => {
    const org = new Organization();
    org.id = 1;
    org.name = 'Acme Corp';
    org.users = [];
    org.tasks = [];
    return org;
  };

  const mockUser = (): User => {
    const user = new User();
    user.id = 1;
    user.username = 'testuser';
    user.passwordHash = 'hashedpass';
    user.role = 'Viewer' as Role;
    user.organization = mockOrganization();
    user.tasks = [];
    return user;
  };

  beforeEach(async () => {
    usersService = {
      findByUsername: jest.fn(),
      findOrCreateOrg: jest.fn(),
      create: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const user = mockUser();
      usersService.findByUsername.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password');

      expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).not.toBeNull(); 
      expect(result!.username).toBe('testuser'); 
    });

    it('should return null for invalid password', async () => {
      const user = mockUser();
      usersService.findByUsername.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('testuser', 'wrongpass');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      const result = await service.validateUser('ghost', 'pass');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const user = mockUser();

      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        if (key === 'JWT_REFRESH_EXPIRATION_SECONDS') return 604800;
        return null;
      });

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'fake-jwt-token');
      expect(result).toHaveProperty('refresh_token', 'fake-jwt-token');
    });
  });

  describe('register', () => {
    it('should create user with org when orgName provided', async () => {
      const org = mockOrganization();
      usersService.findOrCreateOrg.mockResolvedValue(org);
      usersService.create.mockResolvedValue(mockUser());

      const result = await service.register({
        username: 'newuser',
        password: 'password123',
        orgName: 'Acme Corp',
      });

      expect(usersService.findOrCreateOrg).toHaveBeenCalledWith('Acme Corp');
      expect(usersService.create).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
        role: 'Viewer',
        organization: org,
      });
      expect(result).not.toBeNull();
    });

    it('should create user without org if no orgName', async () => {
      usersService.create.mockResolvedValue(mockUser());

      const result = await service.register({
        username: 'solo',
        password: 'nopass',
      });

      expect(usersService.findOrCreateOrg).not.toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledWith({
        username: 'solo',
        password: 'nopass',
        role: 'Viewer',
        organization: null,
      });
      expect(result).not.toBeNull();
    });
  });
});
