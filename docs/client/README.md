# Client-Side Documentation

This document provides detailed information about the client-side implementation of the Oddly lottery application.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [State Management](#state-management)
- [Custom Hooks](#custom-hooks)
- [Utilities](#utilities)
- [Error Handling](#error-handling)
- [PWA Features](#pwa-features)
- [Styling and UI](#styling-and-ui)

## Overview

The client-side of Oddly is a React application built with TypeScript, Vite, and modern frontend tools. It provides a user-friendly interface for generating random number sets, visualizing odds, and managing number history.

## Project Structure

```
client/
├── public/             # Static assets and PWA resources
├── src/
│   ├── api/            # API client for server communication
│   ├── components/     # React components
│   │   ├── custom/     # Application-specific components
│   │   └── ui/         # shadcn/ui components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries
│   ├── stores/         # Zustand state stores
│   └── utils/          # Utility functions
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Core Components

### App Component

The main application component that sets up the layout, theme, and error boundaries.

```tsx
// App.tsx
import "./App.css"
import { NumberSettings } from "@/components/custom/NumberSettings"
import { NumberDisplay } from "@/components/custom/NumberDisplay"
import { StatusBar } from "@/components/custom/StatusBar"
import { ThemeToggle } from "@/components/custom/ThemeToggle"
import { HistoryButton } from "@/components/custom/HistoryButton"
import OddsVisualizer from "./components/custom/OddsVisualizer"
import { TryYourLuck } from "@/components/custom/TryYourLuck"
import ErrorBoundary from "@/components/custom/ErrorBoundary"
import SimulationErrorBoundary from "@/components/custom/SimulationErrorBoundary"
import { GroupIntegration } from "@/components/custom/GroupIntegration"
import { ThemeProvider } from "@/components/theme-provider"
import { motion } from "motion/react"
import { Toaster } from "@/components/ui/sonner"
```

### Key Components

- **NumberSettings**: Controls for adjusting the quantity of numbers and maximum value
- **NumberDisplay**: Displays the generated numbers
- **StatusBar**: Shows the status of available and used numbers
- **OddsVisualizer**: Displays statistical odds of matching different quantities
- **HistoryButton/Dialog**: Interface for viewing and filtering number history
- **TryYourLuck**: Simulation feature for matching a winning set
- **FadingScrollArea**: Custom scroll area with gradient fading edges
- **GroupIntegration**: Interface for the group feature

## State Management

The application uses Zustand with Immer for state management, organized into multiple stores:

### Number Store

Manages the number generation settings and current numbers.

```tsx
// stores/numberStore.ts
interface NumberState {
  // Settings
  quantity: number
  maxValue: number
  numSets: number

  // Generated numbers
  usedNumbers: NumberArray
  currentSet: NumberArray
  remainingCount: number
  hasEnoughNumbers: boolean

  // Actions
  setQuantity: (quantity: number) => void
  setMaxValue: (maxValue: number) => void
  setNumSets: (numSets: number) => void
  generateNumbers: () => void
  resetNumbers: () => void
}
```

### History Store

Tracks the history of generated number sets.

```tsx
// stores/historyStore.ts
interface HistoryState {
  // History entries
  entries: HistoryEntry[]

  // Filter state
  filter: string

  // Computed filtered entries
  filteredEntries: HistoryEntry[]

  // Actions
  addEntry: (numbers: NumberArray, quantity: number, maxValue: number) => void
  setFilter: (filter: string) => void
  clearHistory: () => void
}
```

### Odds Store

Calculates and stores statistical odds.

```tsx
// stores/oddsStore.ts
interface OddsState {
  // Current odds data
  odds: OddsData

  // Worker state
  isCalculating: boolean

  // Actions
  recalculateOdds: () => void
}
```

### Group Store

Manages group functionality for the server integration.

```tsx
// stores/groupStore.ts
interface GroupState {
  // Group data
  currentGroup: Group | null
  members: GroupMember[]
  numberSets: NumberSet[]
  
  // Connection state
  isConnected: boolean
  
  // Actions
  createGroup: (name: string) => Promise<void>
  joinGroup: (invitationCode: string) => Promise<void>
  leaveGroup: () => Promise<void>
  // ...
}
```

## Custom Hooks

The application uses several custom hooks to encapsulate reusable logic:

- **useNumberGenerator**: Manages number generation with Mersenne Twister
- **useReducedMotion**: Respects user preferences for reduced motion
- **useAdaptiveDebounce**: Provides debouncing with adaptive timing
- **useErrorHandler**: Handles errors with toast notifications and logging

## Utilities

### Mersenne Twister

A high-quality pseudorandom number generator implementation.

```tsx
// utils/mersenneTwister.ts
export class MersenneTwister {
  private mt: number[] = new Array(N);
  private index: number = N + 1;
  
  constructor(seed?: number) {
    this.seed(seed ?? Date.now());
  }
  
  public seed(seed: number): void {
    // Implementation details...
  }
  
  public int32(): number {
    // Implementation details...
  }
  
  // Additional methods...
}
```

### Odds Calculation

Calculates statistical odds using hypergeometric distribution.

```tsx
// utils/oddsUtils.ts
export function hypergeometric(k: number, N: number, K: number, n: number): number {
  // Implementation details...
}

export function adjustedProbability(probability: number, numSets: number): number {
  // Implementation details...
}
```

## Error Handling

The application uses a comprehensive error handling system with multiple layers:

- **RootErrorBoundary**: Top-level error boundary
- **Specialized Error Boundaries**: Feature-specific error boundaries
- **useErrorHandler**: Custom hook for handling errors in functional components

## PWA Features

The application is configured as a Progressive Web App with:

- **Service Worker**: For offline support
- **Manifest**: For installation on devices
- **Local Storage**: For data persistence
- **Web Share API**: For sharing number sets

## Styling and UI

The application uses:

- **shadcn/ui**: For UI components based on Radix UI
- **Tailwind CSS**: For styling
- **Framer Motion**: For animations with reduced motion support
