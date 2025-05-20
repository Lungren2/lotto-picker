# Oddly - Random Number Generator

A modern, interactive random number generator built with React, TypeScript, and Vite. This application allows users to generate random number sets for lottery games, raffles, or any scenario requiring unique random numbers.

![Oddly Screenshot](client/public/screenshots/oddly-desktop.png)

## 🌟 Features

- **Random Number Generation**: Generate unique sets of random numbers within a specified range
- **High-Quality Randomness**: Uses the Mersenne Twister (MT19937) algorithm for high-quality pseudorandom number generation
- **Customizable Settings**: Adjust the quantity of numbers and maximum value
- **Number History**: View and filter previously generated number sets
- **Odds Visualization**: See the statistical probability of matching different quantities of numbers
- **Try Your Luck**: Simulate lottery draws to match a winning set with progress tracking and speed controls
- **Preset System**: Save and load favorite configurations with both click and long-press functionality
- **Group Feature**: Create and join groups to prevent duplicate number sets within a group
- **Dark Mode Support**: Toggle between light and dark themes
- **Accessibility**: Respects user preferences for reduced motion
- **Responsive Design**: Works on desktop and mobile devices
- **Persistence**: Saves settings and history to localStorage
- **PWA Support**: Progressive Web App features for offline use
- **Error Handling**: Granular error boundaries for resilient user experience

## 🏗️ Architecture

The application consists of two main components:

### Client-Side

A React application built with TypeScript, Vite, and modern frontend tools:

- **UI Components**: shadcn/ui (based on Radix UI) with Tailwind CSS
- **Animations**: Framer Motion with reduced motion support
- **State Management**: Zustand with Immer
- **Random Number Generation**: Custom Mersenne Twister implementation
- **PWA Features**: Service worker, offline support, and local storage persistence

### Server-Side

A Deno server that provides group functionality:

- **Framework**: Oak for API endpoints
- **Database**: Neon Postgres for data storage
- **Real-time Communication**: Socket.IO
- **Validation**: Zod for data validation

## 📚 Documentation

Detailed documentation is available in the following sections:

- [Client-Side Documentation](docs/client/README.md) - Details about the React application
- [Server-Side Documentation](docs/server/README.md) - Information about the Deno server
- [API Documentation](docs/api/README.md) - API endpoints and data models
- [Architecture Diagrams](docs/architecture/README.md) - Visual representations of the application architecture

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (recommended) or npm
- Deno (v1.37 or higher) for server development

### Installation

#### Client

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   pnpm install
   # or
   npm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

#### Server (Optional - for Group Feature)

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Create a `.env` file with the following content:

   ```env
   NEON_CONNECTION_STRING=postgresql://username:password@your-neon-db-host/dbname
   PORT=8000
   DENO_ENV=development
   ```

3. Start the server:

   ```bash
   deno task dev
   ```

### Building for Production

#### Client

```bash
cd client
pnpm build
# or
npm run build
```

The built files will be in the `dist` directory.

#### Server

```bash
cd server
deno task start
```

## 📱 Usage

1. **Adjust Settings**: Use the sliders to set the quantity of numbers and maximum value
2. **Generate Numbers**: Click the "Generate Set" button to create a new set of random numbers
3. **View History**: Click the history icon to see previously generated sets
4. **Try Your Luck**: Use the simulation feature to try matching a winning set
5. **Use Presets**: Click to load a preset, long-press to save current settings
6. **Toggle Theme**: Click the theme icon to switch between light and dark mode
7. **Reset Pool**: If you run out of available numbers, click "Reset Pool" to clear used numbers
8. **Join a Group**: Use the group feature to prevent duplicate number sets within a group

## 🌐 Deployment

The application is currently deployed at [https://oddly.netlify.app/](https://oddly.netlify.app/)

### CI/CD

The project uses GitHub Actions for continuous integration and deployment:

- **Client**: Automatically deployed to Netlify when changes are pushed to the `main` branch
- **Server**: Automatically deployed to Deno Deploy when changes are pushed to the `main` branch

For detailed information about the CI/CD setup, see the [Deployment Documentation](docs/deployment/README.md).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Framer Motion](https://www.framer.com/motion/) for the smooth animations
- [Zustand](https://zustand-demo.pmnd.rs/) for the state management
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
- [Deno](https://deno.land/) for the server runtime
- [Oak](https://oakserver.github.io/oak/) for the server framework
- [Neon](https://neon.tech/) for the serverless Postgres database