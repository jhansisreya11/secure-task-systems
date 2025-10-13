import { Controller, UseGuards, Post, Body, Get, Request, Param, Put, Delete } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../entities/user.entity';
import { Request as ExpressRequest } from 'express';
import { CreateTaskDto, UpdateTaskDto } from '@secure-task-system/data';

interface AuthenticatedRequest extends ExpressRequest {
  user: User; 
}

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Post()
  @Roles('Owner', 'Admin')
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreateTaskDto,
  ) {
    return this.tasks.create(req.user, body);
  }

  @Get()
  @Roles('Owner', 'Admin', 'Viewer')
  async list(@Request() req: AuthenticatedRequest) {
    return this.tasks.findAll(req.user);
  }

  @Get(':id')
  @Roles('Owner', 'Admin', 'Viewer')
  async get(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tasks.findById(req.user, id);
  }

  @Put(':id')
  @Roles('Owner', 'Admin')
  async update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateTaskDto) {
    return this.tasks.update(req.user, id, body);
  }

  @Delete(':id')
  @Roles('Owner', 'Admin')
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tasks.remove(req.user, id);
  }
}
