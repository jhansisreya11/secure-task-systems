import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { AuditLog } from '../entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  async log(args: {
    actorUserId: number | string;
    actorUsername: string;
    action: string;
    metadata?: any;
  }) {
    const partial: DeepPartial<AuditLog> = {
      actorUserId: String(args.actorUserId),
      actorUsername: args.actorUsername,
      action: args.action,
      metadata: args.metadata !== undefined ? JSON.stringify(args.metadata) : undefined,
    };

    const entry = this.repo.create(partial);
    await this.repo.save(entry);
    return entry;
  }

  async list() {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }
}
