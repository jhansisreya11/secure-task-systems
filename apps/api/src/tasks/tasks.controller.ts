import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '@secure-task-system/auth';

type Status = 'todo' | 'in-progress' | 'done';

interface JwtPayload {
  sub: number;
  username: string;
  role: 'Owner' | 'Admin' | 'Viewer';
  orgId?: number | null;
}

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  private me(req: { user: JwtPayload }) {
    return {
      userId: req.user.sub,
      orgId: req.user.orgId,
      roles: [req.user.role],
    };
  }

  @Post()
  @Roles('Admin', 'Owner')
  async create(@Request() req: { user: JwtPayload }, @Body() body: { title: string; description?: string; status?: Status }) {
    const u = this.me(req);
    if (!u.orgId) throw new ForbiddenException('No organization on token');
    return this.tasks.createWithOrg({
      title: body.title,
      description: body.description,
      status: body.status ?? 'todo',
      createdByUserId: u.userId,
      orgId: u.orgId,
    });
    }

  @Get()
  async findAll(@Request() req: { user: JwtPayload }) {
    const u = this.me(req);
    if (!u.orgId) throw new ForbiddenException('No organization on token');
    return this.tasks.findAllByOrg(u.orgId);
  }

  @Get(':id')
  async findOne(@Request() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    const u = this.me(req);
    if (!u.orgId) throw new ForbiddenException('No organization on token');
    return this.tasks.findByIdScoped(u.orgId, id);
  }

  @Put(':id')
  @Roles('Admin', 'Owner')
  async update(
    @Request() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; description?: string; status?: Status },
  ) {
    const u = this.me(req);
    if (!u.orgId) throw new ForbiddenException('No organization on token');
    return this.tasks.updateInOrg(u.orgId, id, body);
  }

  @Delete(':id')
  @Roles('Admin', 'Owner')
  async remove(@Request() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    const u = this.me(req);
    if (!u.orgId) throw new ForbiddenException('No organization on token');
    return this.tasks.deleteInOrg(u.orgId, id);
  }
}
