import { Controller, Post, Body, BadRequestException,UnauthorizedException, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

class LoginDto {
  username!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService, 
    private usersService: UsersService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,  
  ) {}

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

  @Post('refresh')
  async refresh(@Body('refresh_token') token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const newAccess = this.jwtService.sign({
        username: payload.username,
        sub: payload.sub,
        role: payload.role,
        orgId: payload.orgId,
      });

      return { access_token: newAccess };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
