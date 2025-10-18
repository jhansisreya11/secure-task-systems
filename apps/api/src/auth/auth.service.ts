import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import type { Role } from '@secure-task-system/data';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(username: string, pass: string) {
    if (!username || !pass) return null;
    const user = await this.usersService.findByUsername(username);
    if (!user || !user.passwordHash) return null;
    const ok = await bcrypt.compare(String(pass), String(user.passwordHash));
    if (!ok) return null;
    return user;
  }

  async login(user: any) {
    const role = user.role as Role;
    const roles = [String(role)];
    const payload = {
      username: user.username,
      sub: user.id,
      role,
      roles,
      orgId: user.organization ? Number(user.organization.id) : null,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET') || 'super-refresh-secret',
      expiresIn:
        this.config.get<number>('JWT_REFRESH_EXPIRATION_SECONDS') ?? 60 * 60 * 24 * 7,
    });

    return { access_token, refresh_token };
  }

  // orgName is optional
  async register(body: { username: string; password: string; orgName?: string }) {
    const org = body.orgName
      ? await this.usersService.findOrCreateOrg(body.orgName)
      : null;

    return this.usersService.create({
      username: body.username,
      password: body.password,
      role: 'Viewer',
      organization: org,
    });
  }
}
