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

##### Backend (NestJS + TypeORM + SQLite)

Manages authentication, authorization, and data persistence.
Uses TypeORM entities for Users, Organizations, Tasks, and Audit Logs.
Enforces role-based access control with guards & decorators.
Exposes REST APIs secured by JWT.

##### Frontend (Angular + TailwindCSS)

Implements a login screen and task dashboard.
Stores JWT locally and attaches it to all API requests.
Provides task creation, listing, and editing (with role restrictions).

##### Shared Libraries

libs/data: Common DTOs and interfaces shared between backend and frontend.
libs/auth: Contains RBAC logic (guards, role decorators, JWT helpers).

## Database Schema
The system uses SQLite (default) via TypeORM with the following entities:
### 1. Organization

id (PK, int, auto-increment)
name (unique string)
parentId (nullable, FK → Organization.id)

Relations:
OneToMany → Users (an org has many users)
OneToMany → Tasks (an org has many tasks)
OneToMany → Organizations (self-referencing parent/child hierarchy)

### 2. User

id (PK, int, auto-increment)
username (unique string)
passwordHash (string, hashed password)
role (Owner | Admin | Viewer, default: Viewer)
organizationId (nullable, FK → Organization.id)

Relations:
ManyToOne → Organization (a user belongs to an org)
OneToMany → Tasks (a user can create many tasks)

### 3. Task

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

### 4. AuditLog

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

## Access Control & Data Models
### Roles

Owner – Full access within the organization (CRUD on tasks; manage users/org data where applicable).
Admin – Manage tasks within the organization (CRUD on tasks).
Viewer – Read-only access to tasks in the organization.

### Entities
##### User
Belongs to an Organization.
Has a username, passwordHash, and a single role.
Can create tasks.

##### Organization
Groups users and tasks.
Supports a parent/child hierarchy, though only the basic relationship is in place now.

##### Task
Created by a User.
Always linked to an Organization.
Has title, optional description, and a status (todo, in-progress, or done).
Tracks creation and update timestamps.

##### Audit Log
Records key user actions with actorUserId, actorUsername, action, and optional metadata.
Auto-timestamps with createdAt.

### Enforcement

##### JWT Authentication

Login issues a JWT.
Every protected route checks Authorization: Bearer <token>.
Guards validate the token and attach the user context (id, username, role, org).

##### Role Enforcement

Guards + decorators check if the user’s role allows the requested action.
Example: Viewer cannot create/update/delete tasks.

##### Organization Scoping

Queries on tasks are restricted to the user’s organization.
Prevents cross-org access.

##### Audit Logging

Actions such as task changes can be logged with actor info and metadata for accountability.

## Sample API Requests/Responses
Login

POST /auth/login

```{
  "username": "admin",
  "password": "password"
}```


Success(200)
```{
  "access_token": "eyJhbGciOiJIUzI1..."
}```

Errors

401 if credentials wrong.

List Tasks (org-scoped; Viewer can read)

GET /tasks
Headers: Authorization: Bearer <token>

Success (200) — example right after seeding:

[
  {
    "id": 1,
    "title": "Sample Task 1",
    "description": "Seeded task",
    "status": "todo",
    "createdByUserId": 1,
    "organizationId": 1,
    "createdAt": "2025-10-23T10:00:00.000Z",
    "updatedAt": "2025-10-23T10:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Sample Task 2",
    "description": "Another task",
    "status": "todo",
    "createdByUserId": 2,
    "organizationId": 1,
    "createdAt": "2025-10-23T10:00:00.000Z",
    "updatedAt": "2025-10-23T10:00:00.000Z"
  }
]

Errors

401 if token missing/invalid.

3) Create Task (Owner/Admin only; org is derived from user)

POST /tasks
Headers: Authorization: Bearer <token>

Request (orgId is not required; your service should attach the user’s org automatically)

{
  "title": "Finish project",
  "description": "Complete secure task system",
  "status": "in-progress"
}


Success (201)

{
  "id": 3,
  "title": "Finish project",
  "description": "Complete secure task system",
  "status": "in-progress",
  "createdByUserId": 2,
  "organizationId": 1,
  "createdAt": "2025-10-23T10:05:00.000Z",
  "updatedAt": "2025-10-23T10:05:00.000Z"
}


Errors

401 if token missing/invalid.

403 if role is Viewer.

4) Update Task (Owner/Admin; must be same org)

PUT /tasks/:id
Headers: Authorization: Bearer <token>

Request (any subset of fields)

{
  "title": "Finish project (rev 2)",
  "status": "done"
}


Success (200)

{
  "id": 3,
  "title": "Finish project (rev 2)",
  "description": "Complete secure task system",
  "status": "done",
  "createdByUserId": 2,
  "organizationId": 1,
  "createdAt": "2025-10-23T10:05:00.000Z",
  "updatedAt": "2025-10-23T10:12:31.000Z"
}


Errors

401 if token missing/invalid.

403 if Viewer or task not in user’s org.

404 if task id not found (or filtered out by org scope).

5) Delete Task (Owner/Admin; must be same org)

DELETE /tasks/:id
Headers: Authorization: Bearer <token>

Success (200/204)

{ "deleted": true }


Errors

401 if token missing/invalid.

403 if Viewer or task not in user’s org.

404 if task id not found (or filtered by org scope).

6) (If you wired it) Basic Audit Logging on Sensitive Actions

When you create/update/delete a task, you can (and likely do) write an AuditLog entry:

{
  "id": "1b0e2b3e-7d9e-4a88-9a1f-1e0f9f2a3c5d",
  "actorUserId": "2",
  "actorUsername": "admin",
  "action": "TASK_UPDATE",
  "metadata": "{\"taskId\":3}",
  "createdAt": "2025-10-23T10:12:31.000Z"
}




