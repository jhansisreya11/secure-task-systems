# SecureTaskSystem
A modular full-stack project built with NestJS (backend) and Angular (frontend) in an Nx monorepo.
The system demonstrates secure task management with role-based access control (RBAC), JWT authentication, and organizational scoping of data.

## Run tasks

To run the dev server for your app, use:

Navigate to the backend:

```sh
cd apps/api
```

Install dependencies (from the repo root):

```sh
npm install
```

Configure environment variables:
Create a .env file inside apps/api/:

```sh
DATABASE=db.sqlite
JWT_SECRET=your-secret-key
```

Run database migrations:

```sh
npx typeorm migration:run -d apps/api/src/data-source.ts
```

Start the backend:

```sh
nx serve api
```

## Frontend (Angular Dashboard)

Use the plugin's generator to create new projects.

Navigate to the frontend:

```sh
cd apps/dashboard
```

Start the dashboard:

```sh
nx serve dashboard
```

## Architecture Overview

This project uses an Nx monorepo structure:

apps/
  api/         → NestJS backend (auth, tasks, users, orgs, audit)
  dashboard/   → Angular frontend (login, task management)

libs/
  data/        → Shared TypeScript interfaces & DTOs
  auth/        → RBAC guards, decorators, JWT utilities

## Database Schema
The system uses SQLite (default) via TypeORM with the following entities:
# 1. Organization

id (PK, int, auto-increment)
name (unique string)
parentId (nullable, FK → Organization.id)

Relations:
OneToMany → Users (an org has many users)
OneToMany → Tasks (an org has many tasks)
OneToMany → Organizations (self-referencing parent/child hierarchy)

# 2. User

id (PK, int, auto-increment)
username (unique string)
passwordHash (string, hashed password)
role (Owner | Admin | Viewer, default: Viewer)
organizationId (nullable, FK → Organization.id)

Relations:
ManyToOne → Organization (a user belongs to an org)
OneToMany → Tasks (a user can create many tasks)

# 3. Task

id (PK, int, auto-increment)
title (string)
description (nullable string)
status (varchar: 'todo' | 'in-progress' | 'done', default: todo)
createdByUserId (nullable, FK → User.id)
organizationId (nullable, FK → Organization.id)
createdAt (timestamp, auto)
updatedAt (timestamp, auto)

Relations:
ManyToOne → User (createdBy)
ManyToOne → Organization

# 4. AuditLog

id (PK, uuid)
actorUserId (string)
actorUsername (string)
action (string)
metadata (nullable text)
createdAt (timestamp, auto)

Purpose:
Stores audit trails for user actions (e.g., task creation, updates, role changes).

┌───────────────────┐        ┌───────────────────┐
│   Organization    │1      *│       User        │
│───────────────────│        │───────────────────│
│ id (PK)           │        │ id (PK)           │
│ name (unique)     │        │ username (unique) │
│ parentId (FK→Org) │◄──────►│ passwordHash      │
└───────────────────┘        │ role (Owner/Admin/Viewer)│
       ▲                     │ organizationId (FK)     │
       │                     └───────────────────┘
       │                               │ 1
       │                               │
       │                               │ *
┌───────────────────┐                  │
│   Organization    │◄─────────────────┘
│   (self-child)    │
└───────────────────┘

┌───────────────────┐
│       Task        │
│───────────────────│
│ id (PK)           │
│ title             │
│ description       │
│ status            │
│ createdByUserId(FK)│
│ organizationId(FK)│
│ createdAt         │
│ updatedAt         │
└───────────────────┘

┌───────────────────┐
│     AuditLog      │
│───────────────────│
│ id (uuid, PK)     │
│ actorUserId       │
│ actorUsername     │
│ action            │
│ metadata          │
│ createdAt         │
└───────────────────┘




- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
