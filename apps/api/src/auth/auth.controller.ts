import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsString, MinLength, IsOptional } from 'class-validator';

class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

class RegisterDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsOptional()
  @IsString()
  orgName?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.auth.validateUser(body.username, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.auth.login(user);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    // body has been validated at this point
    return this.auth.register(body); // orgName is optional
  }
}
