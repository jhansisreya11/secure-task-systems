import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

class LoginDto {
  username!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.username, dto.password);
    if (!user) {
      throw new BadRequestException('Invalid username/password');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: { username: string; password: string; role?: any; orgName?: string }) {
    const org = await this.usersService.findOrCreateOrg(body.orgName || 'Default Org');
    const user = await this.usersService.create({
      username: body.username,
      password: body.password,
      role: (body.role as any) || 'Viewer',
      organization: org,
    });
    return { id: user.id, username: user.username };
  }
}
