# Architecture Diagrams

This document provides visual representations of the Oddly lottery application architecture using Mermaid diagrams.

## Table of Contents

- [Application Architecture](#application-architecture)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow](#data-flow)
- [API Request/Response Flow](#api-requestresponse-flow)
- [Database Schema](#database-schema)

## Application Architecture

The following diagram shows the high-level architecture of the Oddly application:

```mermaid
graph TD
    subgraph "Client"
        UI[UI Components]
        Stores[Zustand Stores]
        Hooks[Custom Hooks]
        Utils[Utilities]
        PWA[PWA Features]
        
        UI --> Stores
        UI --> Hooks
        Stores --> Utils
        Hooks --> Utils
        PWA --> Stores
    end
    
    subgraph "Server"
        API[API Endpoints]
        Services[Business Logic]
        DB[Database]
        Socket[Socket.IO]
        
        API --> Services
        Services --> DB
        Socket --> Services
    end
    
    UI --> API
    UI --> Socket
    
    style Client fill:#f9f9f9,stroke:#333,stroke-width:2px
    style Server fill:#f0f0f0,stroke:#333,stroke-width:2px
```

## Component Hierarchy

The following diagram shows the component hierarchy of the client-side application:

```mermaid
graph TD
    App --> ThemeProvider
    App --> RootErrorBoundary
    
    ThemeProvider --> MainLayout
    
    MainLayout --> Header
    MainLayout --> NumberGenerator
    MainLayout --> OddsVisualizer
    MainLayout --> TryYourLuck
    MainLayout --> GroupIntegration
    
    Header --> ThemeToggle
    Header --> HistoryButton
    
    NumberGenerator --> ErrorBoundary1[ErrorBoundary]
    ErrorBoundary1 --> NumberSettings
    ErrorBoundary1 --> NumberDisplay
    ErrorBoundary1 --> StatusBar
    
    OddsVisualizer --> ErrorBoundary2[ErrorBoundary]
    ErrorBoundary2 --> OddsChart
    ErrorBoundary2 --> OddsTable
    
    TryYourLuck --> SimulationErrorBoundary
    SimulationErrorBoundary --> SimulationControls
    SimulationErrorBoundary --> SimulationDisplay
    
    HistoryButton --> HistoryDialog
    HistoryDialog --> HistoryFilter
    HistoryDialog --> HistoryList
    
    GroupIntegration --> GroupDialog
    GroupDialog --> CreateGroupForm
    GroupDialog --> JoinGroupForm
    GroupDialog --> GroupInfo
    
    style App fill:#f9f9f9,stroke:#333,stroke-width:2px
    style RootErrorBoundary fill:#ffe6e6,stroke:#ff0000,stroke-width:1px
    style ErrorBoundary1 fill:#ffe6e6,stroke:#ff0000,stroke-width:1px
    style ErrorBoundary2 fill:#ffe6e6,stroke:#ff0000,stroke-width:1px
    style SimulationErrorBoundary fill:#ffe6e6,stroke:#ff0000,stroke-width:1px
```

## Data Flow

The following diagram shows the data flow in the client-side application:

```mermaid
flowchart TD
    User([User]) -->|Interacts with| UI[UI Components]
    
    UI -->|Updates| NumberStore[Number Store]
    UI -->|Updates| HistoryStore[History Store]
    UI -->|Updates| GroupStore[Group Store]
    
    NumberStore -->|Triggers| OddsStore[Odds Store]
    NumberStore -->|Adds to| HistoryStore
    
    NumberStore -->|Uses| MersenneTwister[Mersenne Twister]
    OddsStore -->|Uses| OddsWorker[Web Worker]
    
    GroupStore -->|Communicates with| API[Server API]
    GroupStore -->|Communicates with| Socket[Socket.IO]
    
    NumberStore -->|Validates with| GroupStore
    
    HistoryStore -->|Persists to| LocalStorage[(Local Storage)]
    NumberStore -->|Persists to| LocalStorage
    
    style User fill:#f9f9f9,stroke:#333,stroke-width:2px
    style UI fill:#d4f4fa,stroke:#333,stroke-width:1px
    style NumberStore fill:#d4fad4,stroke:#333,stroke-width:1px
    style HistoryStore fill:#d4fad4,stroke:#333,stroke-width:1px
    style OddsStore fill:#d4fad4,stroke:#333,stroke-width:1px
    style GroupStore fill:#d4fad4,stroke:#333,stroke-width:1px
    style MersenneTwister fill:#fad4d4,stroke:#333,stroke-width:1px
    style OddsWorker fill:#fad4d4,stroke:#333,stroke-width:1px
    style API fill:#d4d4fa,stroke:#333,stroke-width:1px
    style Socket fill:#d4d4fa,stroke:#333,stroke-width:1px
    style LocalStorage fill:#fafad4,stroke:#333,stroke-width:1px
```

## API Request/Response Flow

The following diagram shows the API request/response flow for the group feature:

```mermaid
sequenceDiagram
    participant Client
    participant API as API Server
    participant DB as Database
    participant Socket as Socket.IO
    
    Note over Client,Socket: Group Creation
    
    Client->>API: POST /groups {name: "My Group"}
    API->>DB: Insert new group
    DB-->>API: Return group data
    API-->>Client: Return group data
    
    Note over Client,Socket: Invitation Creation
    
    Client->>API: POST /invitations {group_id: "123"}
    API->>DB: Insert new invitation
    DB-->>API: Return invitation data
    API-->>Client: Return invitation with code
    
    Note over Client,Socket: Joining a Group
    
    Client->>API: POST /invitations/ABC123/join {client_id: "client-123"}
    API->>DB: Check invitation validity
    API->>DB: Create/update user
    API->>DB: Add user to group
    DB-->>API: Return user and group data
    API-->>Client: Return success response
    
    Note over Client,Socket: Real-time Communication
    
    Client->>Socket: authenticate {clientId: "client-123"}
    Socket-->>Client: authenticated {success: true}
    
    Client->>Socket: join_group {groupId: "123"}
    Socket-->>Client: joined_group {success: true}
    
    Client->>API: POST /number-sets {group_id: "123", numbers: [1,2,3,4,5,6]}
    API->>DB: Validate uniqueness
    API->>DB: Insert number set
    DB-->>API: Return number set data
    API-->>Client: Return success response
    
    Client->>Socket: number_set_generated {groupId: "123", numberSet: {...}}
    Socket->>Socket: Broadcast to group members
    Socket-->>Client: new_number_set {numberSet: {...}}
```

## Database Schema

The following diagram shows the database schema for the server-side application:

```mermaid
erDiagram
    GROUPS {
        uuid id PK
        varchar name
        timestamp created_at
        timestamp updated_at
    }
    
    GROUP_INVITATIONS {
        uuid id PK
        uuid group_id FK
        varchar invitation_code
        timestamp expires_at
        timestamp created_at
    }
    
    USERS {
        uuid id PK
        varchar client_id
        varchar display_name
        timestamp created_at
        timestamp updated_at
    }
    
    GROUP_MEMBERS {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        timestamp joined_at
    }
    
    NUMBER_SETS {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        int[] numbers
        int quantity
        int max_value
        timestamp created_at
    }
    
    GROUPS ||--o{ GROUP_INVITATIONS : "has"
    GROUPS ||--o{ GROUP_MEMBERS : "has"
    GROUPS ||--o{ NUMBER_SETS : "has"
    USERS ||--o{ GROUP_MEMBERS : "belongs to"
    USERS ||--o{ NUMBER_SETS : "creates"
```
