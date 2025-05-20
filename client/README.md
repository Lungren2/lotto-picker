# Lotto Picker - Random Number Generator

A modern, interactive random number generator built with React, TypeScript, and Vite. This application allows users to generate random number sets for lottery games, raffles, or any scenario requiring unique random numbers.

![Lotto Picker Screenshot](screenshot.png)

## Features

- **Random Number Generation**: Generate unique sets of random numbers within a specified range
- **High-Quality Randomness**: Uses the Mersenne Twister (MT19937) algorithm for high-quality pseudorandom number generation
- **Customizable Settings**: Adjust the quantity of numbers and maximum value
- **Number History**: View and filter previously generated number sets
- **Odds Visualization**: See the statistical probability of matching different quantities of numbers
- **Dark Mode Support**: Toggle between light and dark themes
- **Accessibility**: Respects user preferences for reduced motion
- **Responsive Design**: Works on desktop and mobile devices
- **Persistence**: Saves settings and history to localStorage
- **Error Handling**: Granular error boundaries for resilient user experience

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (based on Radix UI)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand with Immer
- **Random Number Generation**: Custom Mersenne Twister implementation

## Architecture

The application follows a modern React architecture with the following key components:

### Core Components

- **App**: Main application component that sets up the layout and theme
- **NumberSettings**: Controls for adjusting the quantity and maximum value
- **NumberDisplay**: Displays the generated numbers
- **StatusBar**: Shows the status of available and used numbers
- **OddsVisualizer**: Displays statistical odds of matching different quantities
- **HistoryButton/Dialog**: Interface for viewing and filtering number history

### State Management

The application uses Zustand with Immer for state management, organized into multiple stores:

- **numberStore**: Manages the number generation settings and current numbers
- **historyStore**: Tracks the history of generated number sets
- **oddsStore**: Calculates and stores statistical odds

### Custom Hooks

- **useNumberGenerator**: Manages the number generation logic
- **useReducedMotion**: Detects user preference for reduced motion
- **useDebounce**: Optimizes performance by debouncing frequent calculations

### Utilities

- **mersenneTwister.ts**: Implementation of the MT19937 algorithm
- **numberUtils.ts**: Utility functions for number generation and manipulation
- **debugLogger.ts**: Utility for logging errors and debugging information

### Error Handling

The application implements a comprehensive error handling strategy with multiple layers of protection:

#### Error Boundaries

- **RootErrorBoundary**: Top-level error boundary that catches any unhandled errors in the application
- **Specialized Error Boundaries**: Feature-specific error boundaries with custom fallback UIs:
  - **HistoryErrorBoundary**: Handles errors in the history feature with options to clear corrupted history data
  - **SimulationErrorBoundary**: Handles errors in the simulation/TryYourLuck feature with reset capabilities
  - **Component-level boundaries**: Smaller boundaries around individual components

#### Error Handling Hooks

- **useErrorHandler**: Custom hook for handling errors in functional components with:
  - Error state management
  - Automatic logging
  - Toast notifications
  - Function wrappers for try/catch handling

#### Error Logging

- Centralized error logging through the debugLogger utility
- Configurable log levels (INFO, WARN, ERROR, DEBUG)
- Persistent logging to localStorage or file system (when available)

#### Developer Usage

To use error boundaries in your components:

```tsx
// Basic usage
<ErrorBoundary boundary="YourFeatureName">
  <YourComponent />
</ErrorBoundary>

// With HOC pattern
const ProtectedComponent = withErrorBoundary(YourComponent, "YourFeatureName");

// With custom error handler hook
const { handleError, withErrorHandling, tryExecute } = useErrorHandler({
  component: "YourComponentName"
});

// Wrap async functions
const safeAsyncFunction = withErrorHandling(async () => {
  // Your async code here
}, "context description");

// Wrap synchronous functions
const safeSyncFunction = tryExecute(() => {
  // Your sync code here
}, "context description");
```

For error recovery, each boundary provides reset mechanisms and can be extended with custom fallback UIs.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (recommended) or npm

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/lotto-picker.git
   cd lotto-picker
   ```

2. Install dependencies

   ```bash
   pnpm install
   # or
   npm install
   ```

3. Start the development server

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Building for Production

```bash
pnpm build
# or
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Adjust Settings**: Use the sliders to set the quantity of numbers and maximum value
2. **Generate Numbers**: Click the "Generate Set" button to create a new set of random numbers
3. **View History**: Click the history icon to see previously generated sets
4. **Toggle Theme**: Click the theme icon to switch between light and dark mode
5. **Reset Pool**: If you run out of available numbers, click "Reset Pool" to clear used numbers

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Framer Motion](https://www.framer.com/motion/) for the smooth animations
- [Zustand](https://zustand-demo.pmnd.rs/) for the state management
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
