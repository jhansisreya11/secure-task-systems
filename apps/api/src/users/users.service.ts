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

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ username });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ id });
  }

  async create({
    username,
    password,
    role = 'Viewer',
    organization,
  }: {
    username: string;
    password: string;
    role?: any;
    organization: Organization;
  }): Promise<User> {   
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({ username, passwordHash, role, organization });
    const saved = await this.usersRepo.save(user);
    return saved;
}

async findOrCreateOrg(name: string) {
    let org = await this.orgRepo.findOne({ where: { name } });
    if (!org) {
      org = this.orgRepo.create({ name });
      org = await this.orgRepo.save(org);
    }
    return org;
  }
}
