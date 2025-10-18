import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';


dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });


const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH ?? 'apps/api/db.sqlite');


const migrationsDir = path.resolve(__dirname, 'migrations');                 
const entitiesGlob  = path.resolve(__dirname, '**/*.entity.{ts,js}');        

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  entities: [entitiesGlob],
  migrations: [path.join(migrationsDir, '*.{ts,js}')],
  migrationsTableName: 'migrations',
  synchronize: true,
  logging: true,
});
console.log('[TypeORM] DB file ->', dbPath);