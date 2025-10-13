import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();

import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit.entity';

const migrationsDir = path.join(__dirname, 'migrations');
const entitiesDir = path.join(__dirname, '**/*.entity.{ts,js}');

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE || 'db.sqlite',
  entities: [entitiesDir],
  migrations: [path.join(migrationsDir,'*.{ts,js}')],
  synchronize: false,
  logging: true,
});
