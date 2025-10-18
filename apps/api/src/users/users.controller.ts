import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    const id = Number(req.user?.sub); // set in JwtStrategy.validate
    if (!id) return null;
    const u = await this.users.findById(id);
    if (!u) return null;
    return {
      id: u.id,
      username: u.username,
      role: u.role,
      // optional roles[] for convenience (guards can use either)
      roles: [u.role],
      organization: u.organization
        ? { id: u.organization.id, name: u.organization.name }
        : null,
    };
  }
}
