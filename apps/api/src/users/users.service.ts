import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
  ) {}

  async findByUsername(username: string) {
    return this.usersRepo.findOne({ where: { username }, relations: ['organization'] });
  }

  async findById(id: number) {
    return this.usersRepo.findOne({ where: { id }, relations: ['organization'] });
  }

  async create(args: {
    username: string;
    password: string;
    role?: 'Owner'|'Admin'|'Viewer';
    organization: Organization | null;
  }) {
    const passwordHash = await bcrypt.hash(String(args.password), 10);
    const user = this.usersRepo.create({
      username: args.username,
      passwordHash,
      role: args.role ?? 'Viewer',
      organization: args.organization ?? null,
    });
    return this.usersRepo.save(user);
  }

  async findOrCreateOrg(name: string) {
    let org = await this.orgRepo.findOne({ where: { name } });
    if (!org) org = await this.orgRepo.save(this.orgRepo.create({ name }));
    return org;
  }
}
