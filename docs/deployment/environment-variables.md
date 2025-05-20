# Environment Variables

This document outlines the environment variables required for deploying the Oddly lottery application.

## GitHub Actions Secrets

The following secrets need to be configured in your GitHub repository settings:

### Client Deployment

| Secret Name | Description |
|-------------|-------------|
| `NETLIFY_AUTH_TOKEN` | Authentication token for Netlify. Generate from Netlify user settings. |
| `NETLIFY_SITE_ID` | ID of your Netlify site. Found in site settings. |
| `VITE_API_URL` | URL of the API server (e.g., `https://api.oddly.app` or `https://your-project.deno.dev`). |

### Server Deployment

| Secret Name | Description |
|-------------|-------------|
| `DOPPLER_TOKEN` | Authentication token for Doppler. Generate from Doppler dashboard. |
| `DENO_DEPLOY_TOKEN` | Authentication token for Deno Deploy. Generate from Deno Deploy dashboard. |
| `DENO_PROJECT` | Name of your Deno Deploy project. |

## Doppler Configuration

The server uses Doppler for managing environment variables. The following variables should be configured in Doppler:

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `PORT` | Port for the server to listen on | `8000` |
| `DENO_ENV` | Environment (development, staging, production) | `production` |
| `NEON_CONNECTION_STRING` | Connection string for Neon PostgreSQL | `postgresql://user:pass@host/db` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `https://oddly.netlify.app,https://oddly.app` |
| `DB_POOL_SIZE` | Database connection pool size | `10` |
| `DB_CONNECTION_TIMEOUT` | Database connection timeout in ms | `30000` |
| `INVITATION_CODE_LENGTH` | Length of invitation codes | `10` |
| `DEFAULT_INVITATION_EXPIRY_HOURS` | Default expiry time for invitations | `24` |
| `SOCKET_PING_INTERVAL` | Socket.IO ping interval in ms | `10000` |
| `SOCKET_PING_TIMEOUT` | Socket.IO ping timeout in ms | `5000` |

## Setting Up Environment Variables

### GitHub Actions Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each of the required secrets listed above

### Doppler Configuration

1. Create a Doppler project for your application
2. Configure the environment variables in the Doppler dashboard
3. Generate a service token for CI/CD
4. Add the service token as the `DOPPLER_TOKEN` secret in GitHub

### Netlify Environment Variables

In addition to the GitHub Actions configuration, you may want to set environment variables directly in Netlify:

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Build & deploy > Environment
3. Add environment variables needed for the client application
