# SecureTaskSystem
A modular full-stack project built with NestJS (backend) and Angular (frontend) in an Nx monorepo.<br>
The system demonstrates secure task management with role-based access control (RBAC), JWT authentication, and organizational scoping of data.

## Run tasks

To run the dev server for your app, use:<br>

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

Use the plugin's generator to create new projects.<br>

Navigate to the frontend:

```sh
cd apps/dashboard
```

Start the dashboard:

```sh
nx serve dashboard
```

## Architecture Overview

This project uses an Nx monorepo structure:<br>

apps/<br>
  api/         → NestJS backend (auth, tasks, users, orgs, audit)<br>
  dashboard/   → Angular frontend (login, task management)<br>

libs/<br>
  data/        → Shared TypeScript interfaces & DTOs<br>
  auth/        → RBAC guards, decorators, JWT utilities<br>

### Backend (NestJS + TypeORM + SQLite)

Manages authentication, authorization, and data persistence.<br>
Uses TypeORM entities for Users, Organizations, Tasks, and Audit Logs.<br>
Enforces role-based access control with guards & decorators.<br>
Exposes REST APIs secured by JWT.<br>

### Frontend (Angular + TailwindCSS)

Implements a login screen and task dashboard.<br>
Stores JWT locally and attaches it to all API requests.<br>
Provides task creation, listing, and editing (with role restrictions).<br>

### Shared Libraries

libs/data: Common DTOs and interfaces shared between backend and frontend.<br>
libs/auth: Contains RBAC logic (guards, role decorators, JWT helpers).<br>

## Database Schema
The system uses SQLite (default) via TypeORM with the following entities:<br>
### 1. Organization

id (PK, int, auto-increment)<br>
name (unique string)<br>
parentId (nullable, FK → Organization.id)<br>

Relations:<br>
OneToMany → Users (an org has many users)<br>
OneToMany → Tasks (an org has many tasks)<br>
OneToMany → Organizations (self-referencing parent/child hierarchy)<br>

### 2. User

id (PK, int, auto-increment)<br>
username (unique string)<br>
passwordHash (string, hashed password)<br>
role (Owner | Admin | Viewer, default: Viewer)<br>
organizationId (nullable, FK → Organization.id)<br>

Relations:
ManyToOne → Organization (a user belongs to an org)<br>
OneToMany → Tasks (a user can create many tasks)<br>

### 3. Task

id (PK, int, auto-increment)<br>
title (string)<br>
description (nullable string)<br>
status (varchar: 'todo' | 'in-progress' | 'done', default: todo)<br>
createdByUserId (nullable, FK → User.id)<br>
organizationId (nullable, FK → Organization.id)<br>
createdAt (timestamp, auto)<br>
updatedAt (timestamp, auto)<br>

Relations:<br>
ManyToOne → User (createdBy)<br>
ManyToOne → Organization<br>

### 4. AuditLog

id (PK, uuid)<br>
actorUserId (string)<br>
actorUsername (string)<br>
action (string)<br>
metadata (nullable text)<br>
createdAt (timestamp, auto)<br>

Purpose:<br>
Stores audit trails for user actions (e.g., task creation, updates, role changes).
<img width="601" height="814" alt="image" src="https://github.com/user-attachments/assets/6754284d-52ea-417c-9668-c2495bd47b4e" />

## Access Control & Data Models
### Roles

Owner – Full access within the organization (CRUD on tasks. Manage users/org data where applicable).<br>
Admin – Manage tasks within the organization (CRUD on tasks).<br>
Viewer – Read-only access to tasks in the organization.<br>

### Entities
### User
Belongs to an Organization.<br>
Has a username, passwordHash, and a single role.<br>
Can create tasks.<br>

### Organization
Groups users and tasks.<br>
Supports a parent/child hierarchy, though only the basic relationship is in place now.<br>

### Task
Created by a User.<br>
Always linked to an Organization.<br>
Has title, optional description, and a status (todo, in-progress, or done).<br>
Tracks creation and update timestamps.<br>

### Audit Log
Records key user actions with actorUserId, actorUsername, action, and optional metadata.<br>
Auto-timestamps with createdAt.<br>

### Enforcement

### JWT Authentication

Login issues a JWT.<br>
Every protected route checks Authorization: Bearer <token>.<br>
Guards validate the token and attach the user context (id, username, role, org).<br>

### Role Enforcement

Guards + decorators check if the user’s role allows the requested action.<br>
Example: Viewer cannot create/update/delete tasks.<br>

### Organization Scoping

Queries on tasks are restricted to the user’s organization.<br>
Prevents cross-org access.<br>

### Audit Logging

Actions such as task changes can be logged with actor info and metadata for accountability.<br>

## Sample API Requests/Responses
### Login

### POST /auth/login

```sh
{
  "username": "admin",
  "password": "password"
}
```

Success(200)
```sh
{
 "access_token": "eyJhbGciOiJIUzI1..."
}
```
### Errors

401 if credentials wrong.

### List Tasks (org-scoped; Viewer can read)

### GET /tasks
Headers: Authorization: Bearer <token>

Success (200) 
```sh
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
```

Errors

401 if token missing/invalid.

### 3) Create Task (Owner/Admin only; org is derived from user)

### POST /tasks
Headers: Authorization: Bearer <token><br>

Request (orgId is not required)<br>

```sh
{
  "title": "Finish project",
  "description": "Complete secure task system",
  "status": "in-progress"
}
```
Success (201)

```sh
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
```
### Errors

401 if token missing/invalid.<br>
403 if role is Viewer.

### 4) Update Task (Owner/Admin; must be same org)

### PUT /tasks/:id
Headers: Authorization: Bearer <token>

Request 
```sh
{
  "title": "Finish project",
  "status": "done"
}
```

Success (200)
```sh
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
```

### Errors

401 if token missing/invalid.<br>
403 if Viewer or task not in user’s org.<br>
404 if task id not found (or filtered out by org scope).<br>

### 5) Delete Task (Owner/Admin; must be same org)

### DELETE /tasks/:id
Headers: Authorization: Bearer <token><br>

Success (200/204)
```sh
{ "deleted": true }
```
### Errors

401 if token missing/invalid.<br>
403 if Viewer or task not in user’s org.<br>
404 if task id not found.<br>

### 6) Basic Audit Logging on Sensitive Actions

When you create/update/delete a task, an AuditLog entry creates:<br>

```sh
{
  "id": "1b0e2b3e-7d9e-4a88-9a1f-1e0f9f2a3c5d",
  "actorUserId": "2",
  "actorUsername": "admin",
  "action": "TASK_UPDATE",
  "metadata": "{\"taskId\":3}",
  "createdAt": "2025-10-23T10:12:31.000Z"
}
```

## Future Enhancements
### 1) Security & Authentication

Add refresh tokens and automatic rotation (short-lived access tokens).<br>
Strengthen password policies and add password reset flows.<br>
Enable 2FA (TOTP) for Owners/Admins.<br>
Add rate limiting, Helmet headers, and CSRF protection for better hardening.<br>

### 2) RBAC & Access Control

Extend from single role to multi-role or fine-grained permissions (e.g., task:updateOwn vs task:updateAny).<br>
Enforce organization hierarchy inheritance (parent org users can manage child org data).<br>

### 3) Audit & Compliance

Persist audit logs for all sensitive actions (logins, role changes, deletions).<br>
Build an API for Owners/Admins to view audit logs with filtering and pagination.<br>
Add tamper-evidence (hash chains or external log sink).<br>

### 4) Data & API Improvements

Move from SQLite → PostgreSQL for production readiness.<br>
Replace synchronize: true with proper migrations.<br>
Add pagination, filters, and sorting to /tasks.<br>
Support soft deletes (deletedAt) and optimistic locking on updates.<br>
Add OpenAPI/Swagger documentation and API versioning.<br>

### 5) Frontend UX

Implement role-aware UI (hide disabled actions for Viewer).<br>
Add search, filtering, and keyboard shortcuts.<br>
Provide dark/light mode toggle and UI polish.<br>
Show toast notifications for errors and success states.<br>

### 6) Observability & Ops

Add structured logging (with user/org context).<br>
Expose metrics and tracing with Prometheus/Grafana.<br>
Provide Docker + docker-compose setup.<br>
Add CI/CD pipeline with lint/test/build checks.<br>

### 7) Testing

Expand unit tests for guards, services, and auth.<br>
Add E2E tests (login + task CRUD + role enforcement).<br>
Run load testing for /tasks under concurrency.<br>

### 8) Admin & Org Management

Build an Admin UI to invite/manage users and set roles.<br>
Add bulk actions (bulk close tasks, bulk role updates).<br>
Support SSO/OAuth2 (Google, Azure AD, Okta).<br>




