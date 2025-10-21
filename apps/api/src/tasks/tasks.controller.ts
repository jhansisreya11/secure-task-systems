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
// ADDED: import AuditService
import { AuditService } from '../audit/audit.service';

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
  constructor(
    private readonly tasks: TasksService,
    // ADDED: inject AuditService
    private readonly audit: AuditService,
  ) {}

  private me(req: { user: JwtPayload }) {
    return {
      userId: req.user.sub,
      orgId: req.user.orgId,
      roles: [req.user.role],
      // ADDED: surface username so we don't touch call sites much
      username: req.user.username,
    };
  }

  @Post()
  @Roles('Admin', 'Owner')
  async create(
    @Request() req: { user: JwtPayload },
    @Body() body: { title: string; description?: string; status?: Status },
  ) {
    const u = this.me(req);
    if (!u.orgId) throw new ForbiddenException('No organization on token');

    // CHANGED MINIMALLY: capture result so we can audit, then return
    const created = await this.tasks.createWithOrg({
      title: body.title,
      description: body.description,
      status: body.status ?? 'todo',
      createdByUserId: u.userId,
      orgId: u.orgId,
    });

    // ADDED: audit log
    await this.audit.log({
      actorUserId: u.userId,
      actorUsername: u.username,
      action: 'TASK_CREATE',
      metadata: { taskId: created.id, orgId: u.orgId },
    });

    return created;
  }

  @Get()
  async findAll(@Request() req: { user: JwtPayload }) {
    const u = this.me(req);
    if (!u.orgId) throw new ForbiddenException('No organization on token');

    // CHANGED MINIMALLY: capture result to log count
    const items = await this.tasks.findAllByOrg(u.orgId);

    // ADDED: audit log
    await this.audit.log({
      actorUserId: u.userId,
      actorUsername: u.username,
      action: 'TASK_LIST',
      metadata: { count: items.length, orgId: u.orgId },
    });

    return items;
  }

  @Get(':id')
  async findOne(@Request() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    const u = this.me(req);
    if (!u.orgId) throw new ForbiddenException('No organization on token');

    // CHANGED MINIMALLY: capture result to log
    const item = await this.tasks.findByIdScoped(u.orgId, id);

    // ADDED: audit log
    await this.audit.log({
      actorUserId: u.userId,
      actorUsername: u.username,
      action: 'TASK_GET',
      metadata: { taskId: id, orgId: u.orgId },
    });

    return item;
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

    // CHANGED MINIMALLY: capture result to log
    const updated = await this.tasks.updateInOrg(u.orgId, id, body);

    // ADDED: audit log
    await this.audit.log({
      actorUserId: u.userId,
      actorUsername: u.username,
      action: 'TASK_UPDATE',
      metadata: { taskId: id, orgId: u.orgId, patch: body },
    });

    return updated;
  }

  @Delete(':id')
  @Roles('Admin', 'Owner')
  async remove(@Request() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    const u = this.me(req);
    if (!u.orgId) throw new ForbiddenException('No organization on token');

    // CHANGED MINIMALLY: capture result to log
    const result = await this.tasks.deleteInOrg(u.orgId, id);

    // ADDED: audit log
    await this.audit.log({
      actorUserId: u.userId,
      actorUsername: u.username,
      action: 'TASK_DELETE',
      metadata: { taskId: id, orgId: u.orgId },
    });

    return result;
  }
}
