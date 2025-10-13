import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1760369943094 implements MigrationInterface {
    name = 'InitialMigration1760369943094'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "task" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" varchar, "status" varchar NOT NULL DEFAULT ('todo'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "organizationId" varchar, "createdById" varchar)`);
        await queryRunner.query(`CREATE TABLE "organization" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "parentOrgId" varchar, CONSTRAINT "UQ_c21e615583a3ebbb0977452afb0" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar NOT NULL, "passwordHash" varchar NOT NULL, "role" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "organizationId" varchar, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"))`);
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" varchar PRIMARY KEY NOT NULL, "actorUserId" varchar NOT NULL, "actorUsername" varchar NOT NULL, "action" varchar NOT NULL, "metadata" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "temporary_task" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" varchar, "status" varchar NOT NULL DEFAULT ('todo'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "organizationId" varchar, "createdById" varchar, CONSTRAINT "FK_5b0272d923a31c972bed1a1ac4d" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_91d76dd2ae372b9b7dfb6bf3fd2" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_task"("id", "title", "description", "status", "createdAt", "updatedAt", "organizationId", "createdById") SELECT "id", "title", "description", "status", "createdAt", "updatedAt", "organizationId", "createdById" FROM "task"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`ALTER TABLE "temporary_task" RENAME TO "task"`);
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar NOT NULL, "passwordHash" varchar NOT NULL, "role" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "organizationId" varchar, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "FK_dfda472c0af7812401e592b6a61" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "username", "passwordHash", "role", "createdAt", "organizationId") SELECT "id", "username", "passwordHash", "role", "createdAt", "organizationId" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar NOT NULL, "passwordHash" varchar NOT NULL, "role" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "organizationId" varchar, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"))`);
        await queryRunner.query(`INSERT INTO "user"("id", "username", "passwordHash", "role", "createdAt", "organizationId") SELECT "id", "username", "passwordHash", "role", "createdAt", "organizationId" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
        await queryRunner.query(`ALTER TABLE "task" RENAME TO "temporary_task"`);
        await queryRunner.query(`CREATE TABLE "task" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" varchar, "status" varchar NOT NULL DEFAULT ('todo'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "organizationId" varchar, "createdById" varchar)`);
        await queryRunner.query(`INSERT INTO "task"("id", "title", "description", "status", "createdAt", "updatedAt", "organizationId", "createdById") SELECT "id", "title", "description", "status", "createdAt", "updatedAt", "organizationId", "createdById" FROM "temporary_task"`);
        await queryRunner.query(`DROP TABLE "temporary_task"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "organization"`);
        await queryRunner.query(`DROP TABLE "task"`);
    }

}
