import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '@secure-task-system/auth';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  // Owners/Admins only per PDF
  @Get()
  @Roles('Owner', 'Admin')
  async list() {
    return this.audit.list();
  }
}
