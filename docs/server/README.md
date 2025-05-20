# Server-Side Documentation

This document provides detailed information about the server-side implementation of the Oddly lottery application.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Socket.IO Integration](#socketio-integration)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Deployment](#deployment)

## Overview

The server-side of Oddly is a Deno application built with the Oak framework. It provides a group feature that allows users to create and join groups to prevent duplicate number sets within a group.

## Project Structure

```
server/
├── db/                # Database-related code
│   ├── client.ts      # Database client
│   ├── migrations.ts  # Database migrations
│   └── schema.ts      # Zod schemas for data validation
├── routes/            # API route handlers
│   ├── groups.ts      # Group-related routes
│   ├── invitations.ts # Invitation-related routes
│   └── numberSets.ts  # Number set-related routes
├── services/          # Business logic
│   ├── groupService.ts    # Group-related services
│   └── numberService.ts   # Number set-related services
├── utils/             # Utility functions
│   ├── errors.ts      # Custom error classes
│   └── validation.ts  # Validation utilities
├── config.ts          # Configuration settings
├── main.ts            # Application entry point
├── middleware.ts      # Middleware functions
├── socketHandlers.ts  # Socket.IO event handlers
└── deno.json          # Deno configuration
```

## Core Components

### Main Application

The main application file sets up the Oak application, middleware, routes, and Socket.IO server.

```ts
// main.ts
import { Application, Router, Context } from "@oak/oak";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { config } from "./config.ts";
import { errorHandler, requestLogger } from "./middleware.ts";
import groupsRouter from "./routes/groups.ts";
import invitationsRouter from "./routes/invitations.ts";
import numberSetsRouter from "./routes/numberSets.ts";
import { setupSocketHandlers } from "./socketHandlers.ts";
import { initializeDatabase } from "./db/client.ts";
import { runMigrations } from "./db/migrations.ts";

// Load environment variables
const PORT = config.port;
const ENV = config.env;

// Initialize the database and run migrations
async function startServer() {
  try {
    console.log("Initializing database connection...");
    await initializeDatabase();
    
    console.log("Running database migrations...");
    await runMigrations();
    
    // Create Oak application
    const app = new Application();
    const router = new Router();
    
    // Set up CORS
    app.use(oakCors({
      origin: config.corsOrigins,
      credentials: true,
    }));
    
    // Middleware
    app.use(requestLogger);
    app.use(errorHandler);
    
    // Health check route
    router.get("/health", (ctx: Context) => {
      ctx.response.body = { 
        status: "ok", 
        timestamp: new Date().toISOString(),
        environment: ENV
      };
    });
    
    // API info route
    router.get("/", (ctx: Context) => {
      ctx.response.body = { 
        name: "Oddly API Server",
        version: "1.0.0",
        description: "API server for the Oddly lottery application group feature"
      };
    });
    
    // Mount routers
    app.use(groupsRouter.routes());
    app.use(groupsRouter.allowedMethods());
    app.use(invitationsRouter.routes());
    app.use(invitationsRouter.allowedMethods());
    app.use(numberSetsRouter.routes());
    app.use(numberSetsRouter.allowedMethods());
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    // Set up Socket.IO server
    const io = new Server({
      cors: {
        origin: config.corsOrigins,
        credentials: true,
      },
    });
    
    // Set up Socket.IO handlers
    setupSocketHandlers(io);
    
    // Start the server
    console.log(`Starting server in ${ENV} mode on port ${PORT}...`);
    
    const httpServer = await app.listen({ port: PORT });
    console.log(`HTTP server running on http://localhost:${PORT}`);
    
    // Attach Socket.IO to the HTTP server
    io.attach(httpServer);
    console.log(`Socket.IO server attached`);
    
    // Handle shutdown gracefully
    Deno.addSignalListener("SIGINT", () => {
      console.log("Shutting down server...");
      httpServer.close();
      Deno.exit(0);
    });
    
    Deno.addSignalListener("SIGTERM", () => {
      console.log("Shutting down server...");
      httpServer.close();
      Deno.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    Deno.exit(1);
  }
}

// Start the server
startServer();
```

## Database

The application uses Neon Postgres for data storage. The database schema is defined in the migrations file.

### Schema

```ts
// db/migrations.ts
const migrations = [
  {
    name: "001_initial_schema",
    up: `
      -- Groups table
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Group invitations table
      CREATE TABLE IF NOT EXISTS group_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        invitation_code VARCHAR(20) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_invitation_code UNIQUE (invitation_code)
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Group members table
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
      );

      -- Number sets table
      CREATE TABLE IF NOT EXISTS number_sets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        numbers INTEGER[] NOT NULL,
        quantity INTEGER NOT NULL,
        max_value INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
      CREATE INDEX IF NOT EXISTS idx_number_sets_group_id ON number_sets(group_id);
      CREATE INDEX IF NOT EXISTS idx_group_invitations_code ON group_invitations(invitation_code);
      
      -- Create a unique constraint on group_id and numbers to prevent duplicates
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_number_set_per_group 
      ON number_sets(group_id, md5(numbers::text));
    `
  }
];
```

## API Endpoints

The server provides the following API endpoints:

### Groups

- `POST /groups` - Create a new group
- `GET /groups/:id` - Get a group by ID
- `GET /groups/:id/members` - Get all members of a group
- `GET /groups/:id/number-sets` - Get all number sets for a group

### Invitations

- `POST /invitations` - Create a new invitation
- `GET /invitations/:code` - Get an invitation by code
- `POST /invitations/:code/join` - Join a group using an invitation code

### Number Sets

- `POST /number-sets` - Create a new number set
- `GET /number-sets/:id` - Get a number set by ID
- `GET /number-sets/validate` - Validate if a number set is unique within a group

## Socket.IO Integration

The server uses Socket.IO for real-time communication with clients.

```ts
// socketHandlers.ts
export function setupSocketHandlers(io: Server): void {
  // Track connected users
  const connectedUsers = new Map<string, ConnectedUser>()

  io.on("connection", (socket: Socket) => {
    console.log(`New connection: ${socket.id}`)

    // Handle authentication
    socket.on("authenticate", async (payload: AuthPayload) => {
      try {
        // Store user information
        connectedUsers.set(socket.id, {
          clientId: payload.clientId,
          userId: payload.userId,
          username: payload.username
        })

        console.log(`User authenticated: ${payload.clientId}`)
        
        // Acknowledge successful authentication
        socket.emit("authenticated", { success: true })
      } catch (error) {
        console.error("Authentication error:", error)
        socket.emit("error", { message: "Authentication failed" })
      }
    })

    // Handle joining a group
    socket.on("join_group", async (payload: JoinGroupPayload) => {
      try {
        const user = connectedUsers.get(socket.id)
        
        if (!user) {
          throw new Error("User not authenticated")
        }
        
        // Join the socket to the group room
        socket.join(`group:${payload.groupId}`)
        console.log(`User ${user.clientId} joined group ${payload.groupId}`)
        
        // Acknowledge successful join
        socket.emit("joined_group", { 
          success: true,
          groupId: payload.groupId
        })
      } catch (error) {
        console.error("Join group error:", error)
        socket.emit("error", { message: "Failed to join group" })
      }
    })

    // Handle number set generation
    socket.on("number_set_generated", (payload: NumberSetGeneratedPayload) => {
      try {
        const user = connectedUsers.get(socket.id)
        
        if (!user) {
          throw new Error("User not authenticated")
        }
        
        // Broadcast to all members of the group except the sender
        socket.to(`group:${payload.groupId}`).emit("new_number_set", {
          ...payload,
          userId: user.userId,
          username: user.username
        })
        
        console.log(`Number set broadcast to group ${payload.groupId}`)
      } catch (error) {
        console.error("Number set broadcast error:", error)
        socket.emit("error", { message: "Failed to broadcast number set" })
      }
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Disconnected: ${socket.id}`)
      connectedUsers.delete(socket.id)
    })
  })
}
```

## Error Handling

The server uses custom error classes and middleware for consistent error handling.

```ts
// utils/errors.ts
export class NotFoundError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "ConflictError";
  }
}

export class BadRequestError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "BadRequestError";
  }
}

// middleware.ts
export async function errorHandler(ctx: Context, next: () => Promise<unknown>) {
  try {
    await next();
  } catch (error) {
    console.error("Error:", error);
    
    if (error instanceof NotFoundError) {
      ctx.response.status = 404;
    } else if (error instanceof BadRequestError) {
      ctx.response.status = 400;
    } else if (error instanceof ConflictError) {
      ctx.response.status = 409;
    } else {
      ctx.response.status = 500;
    }
    
    ctx.response.body = {
      success: false,
      error: {
        message: error.message,
        name: error.name,
        details: error.details || undefined
      }
    };
  }
}
```

## Configuration

The server uses a configuration file to manage environment-specific settings.

```ts
// config.ts
export const config = {
  env: ENV,
  port: PORT,
  db: {
    connectionString: NEON_CONNECTION_STRING,
    poolSize: 10,
    connectionTimeout: 30000, // 30 seconds
  },
  corsOrigins,
  security: {
    invitationCodeLength: 10,
    defaultInvitationExpiryHours: 24,
  },
  socketIO: {
    pingInterval: 10000,
    pingTimeout: 5000,
  }
};
```

## Deployment

The Deno server can be deployed to:

- [Deno Deploy](https://deno.com/deploy)
- Any platform that supports Deno (e.g., Docker containers)

### Deployment Steps

1. Set up environment variables on the deployment platform
2. Deploy the code to the platform
3. Ensure the database is accessible from the deployment environment
4. Configure CORS settings for the production domain
