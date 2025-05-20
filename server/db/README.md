# Lotto Picker Database

This directory contains the database schema, migrations, and initialization scripts for the Lotto Picker application.

## Database Schema

The Lotto Picker application uses PostgreSQL as its database. The schema consists of the following tables:

- **groups**: Lottery groups that users can join
- **users**: Users who can join groups and create number sets
- **group_invitations**: Invitations to join groups
- **group_members**: Users who are members of groups
- **number_sets**: Sets of lottery numbers created by users
- **migrations**: Tracks database migrations that have been applied

## Database Initialization

The database can be initialized using the provided scripts:

```bash
# Initialize the database for development (includes sample data)
deno task db:init:dev

# Initialize the database for staging
deno task db:init:staging

# Initialize the database for production
deno task db:init:prod

# Initialize using Doppler for environment variables
deno task doppler:db:init
```

## Database Schema Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     groups      │       │  group_members   │       │      users      │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)          │       │ id (PK)         │
│ name            │       │ group_id (FK)    │◄──────┤ client_id       │
│ created_at      │       │ user_id (FK)     │       │ display_name    │
│ updated_at      │       │ joined_at        │       │ created_at      │
└─────────────────┘       └──────────────────┘       │ updated_at      │
        ▲                                             └─────────────────┘
        │                                                     ▲
        │                                                     │
        │                                                     │
┌─────────────────┐                               ┌─────────────────┐
│group_invitations│                               │   number_sets   │
├─────────────────┤                               ├─────────────────┤
│ id (PK)         │                               │ id (PK)         │
│ group_id (FK)   │                               │ group_id (FK)   │
│ invitation_code │                               │ user_id (FK)    │
│ expires_at      │                               │ numbers         │
│ created_at      │                               │ quantity        │
└─────────────────┘                               │ max_value       │
                                                  │ created_at      │
                                                  └─────────────────┘
```

## Database Connection

The application connects to the database using the connection string provided in the `NEON_CONNECTION_STRING` environment variable. This can be set directly or via Doppler.

## Migrations

The database schema is managed through migrations. The initial schema is created by the `init.sql` script, and subsequent changes can be applied through the migration system.

## Sample Data

In development mode, the initialization script creates sample data:
- A sample group called "Sample Lottery Group"
- A sample user with client ID "sample-client-id" and display name "Sample User"
- A sample group membership connecting the user to the group
- A sample invitation with code "SAMPLE123"
- A sample number set with numbers [1, 7, 13, 24, 35, 42]

## PostgreSQL Features Used

The database initialization script uses several PostgreSQL features:

- **UUID Generation**: Using the `pgcrypto` extension for `gen_random_uuid()`
- **Array Data Type**: For storing lottery numbers as an array
- **Triggers**: For automatically updating the `updated_at` timestamp
- **Schemas**: For organizing database objects
- **Constraints**: For enforcing data integrity
- **Indexes**: For optimizing query performance
- **Comments**: For documenting the database schema

## Best Practices

The database schema follows these best practices:

- **Idempotent Scripts**: The initialization script can be run multiple times without errors
- **Transactions**: All changes are wrapped in a transaction for atomicity
- **Foreign Keys**: Relationships between tables are enforced with foreign keys
- **Timestamps**: Creation and update times are tracked
- **Indexing**: Appropriate indexes are created for performance
- **Constraints**: Data integrity is enforced with constraints
- **Documentation**: Tables and columns are documented with comments
