import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
// Remove this if you don't have it:
// import { AuditLog } from './entities/audit.entity';
import * as bcrypt from 'bcryptjs';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: `${__dirname}/../db.sqlite`,
  entities: [User, Organization, Task], // AuditLog removed unless you have it
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();

  const orgRepo = AppDataSource.getRepository(Organization);
  const userRepo = AppDataSource.getRepository(User);
  const taskRepo = AppDataSource.getRepository(Task);

  let org = await orgRepo.findOne({ where: { name: 'Acme Inc' } });
  if (!org) {
    org = orgRepo.create({ name: 'Acme Inc' });
    org = await orgRepo.save(org);
  }

  async function createUserIfNotExists(username: string, role: 'Owner' | 'Admin' | 'Viewer') {
    let user = await userRepo.findOne({ where: { username } });
    if (!user) {
      const hash = await bcrypt.hash('password', 10);
      user = userRepo.create({
        username,
        passwordHash: hash,   // <-- writes to passwordHash
        role,
        organization: org!,
      });
      user = await userRepo.save(user);
      console.log('created user', username, role);
    }
    return user;
  }

  const owner = await createUserIfNotExists('owner', 'Owner');
  const admin = await createUserIfNotExists('admin', 'Admin');
  const viewer = await createUserIfNotExists('viewer', 'Viewer');

  const existingTasks = await taskRepo.find();
  if (existingTasks.length === 0) {
    await taskRepo.save(taskRepo.create({
      title: 'Sample Task 1',
      description: 'Seeded task',
      organization: org!,
      createdBy: owner
    }));
    await taskRepo.save(taskRepo.create({
      title: 'Sample Task 2',
      description: 'Another task',
      organization: org!,
      createdBy: admin
    }));
    console.log('seeded tasks');
  }

  console.log('seed complete');
  process.exit(0);
}

seed().catch(err => {
  console.error('SEED ERROR:', err?.stack || err);
  process.exit(1);
});
