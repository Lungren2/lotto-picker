# API Documentation

This document provides detailed information about the API endpoints and data models for the Oddly lottery application.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Groups](#groups)
  - [Invitations](#invitations)
  - [Number Sets](#number-sets)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Socket.IO Events](#socketio-events)

## Overview

The Oddly API provides endpoints for managing groups, invitations, and number sets. It uses RESTful principles and returns JSON responses.

## Base URL

- Development: `http://localhost:8000`
- Production: `https://api.oddly.app` (example)

## Authentication

The API uses client-based authentication. Clients identify themselves using a client ID, which is generated on the client side and stored in localStorage.

## API Endpoints

### Groups

#### Create a Group

Creates a new group.

- **URL**: `/groups`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "My Lottery Group"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "My Lottery Group",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
  }
  ```

#### Get a Group

Retrieves a group by ID.

- **URL**: `/groups/:id`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "My Lottery Group",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
  }
  ```

#### Get Group Members

Retrieves all members of a group.

- **URL**: `/groups/:id/members`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "user_id": "123e4567-e89b-12d3-a456-426614174002",
        "group_id": "123e4567-e89b-12d3-a456-426614174000",
        "client_id": "client-123",
        "display_name": "John Doe",
        "joined_at": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

#### Get Group Number Sets

Retrieves all number sets for a group.

- **URL**: `/groups/:id/number-sets`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "group_id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": "123e4567-e89b-12d3-a456-426614174002",
        "numbers": [1, 2, 3, 4, 5, 6],
        "quantity": 6,
        "max_value": 49,
        "created_at": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### Invitations

#### Create an Invitation

Creates a new invitation for a group.

- **URL**: `/invitations`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "group_id": "123e4567-e89b-12d3-a456-426614174000",
    "expires_in_hours": 24
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "group_id": "123e4567-e89b-12d3-a456-426614174000",
      "invitation_code": "ABC123XYZ",
      "expires_at": "2023-01-02T00:00:00.000Z",
      "created_at": "2023-01-01T00:00:00.000Z"
    }
  }
  ```

#### Get an Invitation

Retrieves an invitation by code.

- **URL**: `/invitations/:code`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "group_id": "123e4567-e89b-12d3-a456-426614174000",
      "group_name": "My Lottery Group",
      "invitation_code": "ABC123XYZ",
      "expires_at": "2023-01-02T00:00:00.000Z",
      "created_at": "2023-01-01T00:00:00.000Z"
    }
  }
  ```

#### Join a Group

Joins a group using an invitation code.

- **URL**: `/invitations/:code/join`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "client_id": "client-123",
    "display_name": "John Doe"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "group": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "My Lottery Group"
      },
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174002",
        "client_id": "client-123",
        "display_name": "John Doe"
      },
      "member": {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "group_id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": "123e4567-e89b-12d3-a456-426614174002",
        "joined_at": "2023-01-01T00:00:00.000Z"
      }
    }
  }
  ```

### Number Sets

#### Create a Number Set

Creates a new number set for a group.

- **URL**: `/number-sets`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "group_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174002",
    "numbers": [1, 2, 3, 4, 5, 6],
    "quantity": 6,
    "max_value": 49
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "group_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "123e4567-e89b-12d3-a456-426614174002",
      "numbers": [1, 2, 3, 4, 5, 6],
      "quantity": 6,
      "max_value": 49,
      "created_at": "2023-01-01T00:00:00.000Z"
    }
  }
  ```

#### Validate a Number Set

Validates if a number set is unique within a group.

- **URL**: `/number-sets/validate`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "group_id": "123e4567-e89b-12d3-a456-426614174000",
    "numbers": [1, 2, 3, 4, 5, 6],
    "quantity": 6,
    "max_value": 49
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "isUnique": true,
      "existingSet": null
    }
  }
  ```

## Data Models

### Group

```ts
interface Group {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

### Group Invitation

```ts
interface GroupInvitation {
  id: string;
  group_id: string;
  invitation_code: string;
  expires_at: string;
  created_at: string;
}
```

### User

```ts
interface User {
  id: string;
  client_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}
```

### Group Member

```ts
interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}
```

### Number Set

```ts
interface NumberSet {
  id: string;
  group_id: string;
  user_id: string;
  numbers: number[];
  quantity: number;
  max_value: number;
  created_at: string;
}
```

## Error Handling

The API returns consistent error responses with the following structure:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "name": "ErrorType",
    "details": {}
  }
}
```

### Error Types

- `NotFoundError` (404): Resource not found
- `BadRequestError` (400): Invalid request parameters
- `ConflictError` (409): Resource conflict (e.g., duplicate number set)
- `InternalServerError` (500): Server error

## Socket.IO Events

### Client to Server Events

- `authenticate`: Authenticate the client
  ```ts
  {
    clientId: string;
    userId: string;
    username?: string;
  }
  ```

- `join_group`: Join a group room
  ```ts
  {
    groupId: string;
  }
  ```

- `number_set_generated`: Notify about a new number set
  ```ts
  {
    groupId: string;
    numberSet: {
      id: string;
      numbers: number[];
      quantity: number;
      maxValue: number;
    }
  }
  ```

### Server to Client Events

- `authenticated`: Authentication successful
  ```ts
  {
    success: true;
  }
  ```

- `joined_group`: Successfully joined a group
  ```ts
  {
    success: true;
    groupId: string;
  }
  ```

- `new_number_set`: New number set notification
  ```ts
  {
    groupId: string;
    numberSet: {
      id: string;
      numbers: number[];
      quantity: number;
      maxValue: number;
    };
    userId: string;
    username?: string;
  }
  ```

- `error`: Error notification
  ```ts
  {
    message: string;
  }
  ```
