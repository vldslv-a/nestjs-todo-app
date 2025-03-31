# NestJS Todo App

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

A full-featured Todo application API built with NestJS, featuring user authentication, task management, list sharing, and more.

## Description

This project is a RESTful API for a Todo application built with NestJS, a progressive Node.js framework for building efficient and scalable server-side applications. The API provides all the necessary endpoints to manage users, todo lists, tasks, and more.

## Current Features

### Authentication & Authorization
- JWT-based authentication
- OAuth integration (Google)
- Email verification
- Password reset functionality

### User Management
- Registration and login
- Profile management
- Avatar/logo upload

### File Management
- Secure file uploads
- Image processing and storage

## Roadmap (Planned Features)

### Todo Lists
- Create, read, update, delete operations
- Priority-based filtering
- Hidden lists support

### Sharing System
- Invite users to lists
- Permission management (Viewer, Editor, Admin)
- View shared lists

### Task Management
- Create, read, update, delete tasks
- Set task priorities
- Status tracking
- Filter tasks by status, priority, assignee
- Hierarchical tasks (up to 3 levels of subtasks)
- Task assignees management

### Change Tracking & Logging
- History of changes for lists and tasks
- Filtering history by action types and users

## Technologies
- [NestJS](https://nestjs.com/) - A progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [PostgreSQL](https://www.postgresql.org/) - SQL database
- [JWT](https://jwt.io/) - For secure authentication
- [Swagger](https://swagger.io/) - API documentation
- [Jest](https://jestjs.io/) - Testing framework

## Project Setup

### Clone the repository
```bash
git clone https://github.com/vldslv-a/nestjs-todo-app.git
cd nestjs-todo-app
```

### Install dependencies
```bash
npm install
```

### Configure environment variables
Edit a `.env` file in the root directory with the following variables.

### Setup the database
```bash
# Run database migrations
npx prisma migrate dev
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

http://localhost:3000/api/docs

The Swagger JSON for Postman is available at:

http://localhost:3000/api/swagger.json

## Project Structure

```
src/
├── app.module.ts        # Main application module
├── main.ts              # Application entry point
├── auth/                # Authentication related modules
├── common/              # Shared resources
├── config/              # Application configuration
├── cookie/              # Cookie handling
├── files/               # File upload handling
├── mail/                # Email functionality
├── oauth/               # OAuth integration
├── prisma/              # Database connection and models
├── token/               # JWT token management
├── users/               # User management
└── verification/        # Email verification
```
