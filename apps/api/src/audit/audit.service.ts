import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>) {}

  async log(actorUserId: string, actorUsername: string, action: string, metadata?: any) {
    const record = this.auditRepo.create({
      actorUserId,
      actorUsername,
      action,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
    await this.auditRepo.save(record);
    console.log('[AUDIT]', actorUsername, action, metadata || '');
  }

  async list() {
    return this.auditRepo.find({ order: { createdAt: 'DESC' } });
  }
}
