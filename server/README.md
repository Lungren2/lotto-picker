# Lotto Picker API Server

This is the API server for the Lotto Picker application, providing group features and real-time collaboration.

## Technology Stack

- **Runtime**: [Deno](https://deno.land/)
- **Web Framework**: [Oak](https://jsr.io/@oak/oak)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/)
- **Real-time Communication**: [Socket.IO](https://socket.io/)
- **Secrets Management**: [Doppler](https://www.doppler.com/)
- **CI/CD**: GitHub Actions

## Prerequisites

- [Deno](https://deno.land/#installation) v1.40.0 or higher
- [Doppler CLI](https://docs.doppler.com/docs/cli) for secrets management

## Environment Variables

The application uses the following environment variables:

| Variable                          | Description                             | Default                 |
| --------------------------------- | --------------------------------------- | ----------------------- |
| `DENO_ENV`                        | Environment (development, production)   | `development`           |
| `PORT`                            | HTTP server port                        | `8000`                  |
| `NEON_CONNECTION_STRING`          | PostgreSQL connection string            | (required)              |
| `CORS_ORIGINS`                    | Comma-separated list of allowed origins | (varies by environment) |
| `DB_POOL_SIZE`                    | Database connection pool size           | `10`                    |
| `DB_CONNECTION_TIMEOUT`           | Database connection timeout (ms)        | `30000`                 |
| `INVITATION_CODE_LENGTH`          | Length of generated invitation codes    | `10`                    |
| `DEFAULT_INVITATION_EXPIRY_HOURS` | Default expiry time for invitations     | `24`                    |
| `SOCKET_PING_INTERVAL`            | Socket.IO ping interval (ms)            | `10000`                 |
| `SOCKET_PING_TIMEOUT`             | Socket.IO ping timeout (ms)             | `5000`                  |

## Doppler Integration

This project uses Doppler for secrets management. Follow these steps to set up Doppler:

### 1. Install the Doppler CLI

**Windows (PowerShell)**:
```powershell
(Invoke-WebRequest -Uri "https://cli.doppler.com/install.ps1" -UseBasicParsing).Content | powershell -Command -
```

**macOS (Homebrew)**:
```bash
brew install dopplerhq/cli/doppler
```

**Linux (apt)**:
```bash
sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg
curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | sudo apt-key add -
echo "deb https://packages.doppler.com/public/cli/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/doppler-cli.list
sudo apt-get update && sudo apt-get install doppler
```

### 2. Authenticate with Doppler

```bash
doppler login
```

### 3. Configure Your Project

The project includes a `doppler.yaml` file that links to the Doppler project. To set up:

```bash
doppler setup
```

This will prompt you to select your Doppler project and configuration.

### 4. Running with Doppler

Use the Doppler-enabled tasks in `deno.json`:

```bash
# Development mode with Doppler
deno task doppler:dev

# Production mode with Doppler
deno task doppler:start

# Run tests with Doppler
deno task doppler:test
```

Alternatively, you can prefix any command with `doppler run --`:

```bash
doppler run -- deno run --allow-net --allow-env main.ts
```

## Development

1. Clone the repository
2. Set up Doppler as described above
3. Initialize the database:
   ```bash
   deno task doppler:db:init
   ```
4. Run the development server:
   ```bash
   deno task doppler:dev
   ```
5. The server will be available at http://localhost:8000

## Database Management

The application includes several tasks for managing the database:

```bash
# Initialize the database
deno task db:init

# Initialize with environment-specific settings
deno task db:init:dev
deno task db:init:staging
deno task db:init:prod

# Show database information
deno task db:info

# List all tables
deno task db:tables

# Show database statistics
deno task db:stats

# Seed the database with sample data
deno task db:seed

# Clear all data (keeps structure)
deno task db:clear

# Drop all tables
deno task db:drop

# Run with Doppler for environment variables
deno task doppler:db:init
deno task doppler:db:manage info
```

For more information about the database schema and management, see [db/README.md](db/README.md).

## CI/CD Integration

This project includes GitHub Actions workflows for continuous integration and deployment to Deno Deploy. To set up CI/CD:

1. **Create a Doppler Service Token**:
   ```bash
   doppler configs tokens create ci-cd-token --project lotto-picker --config prd_api --plain
   ```

2. **Set Up Deno Deploy**:
   - Create a project in [Deno Deploy](https://dash.deno.com/projects)
   - Generate a deployment token from your account settings

3. **Add Secrets to GitHub**:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Add the following repository secrets:
     - `DOPPLER_TOKEN`: The Doppler service token generated above
     - `DENO_DEPLOY_TOKEN`: Your Deno Deploy token
     - `DENO_PROJECT`: Your Deno Deploy project name

4. **GitHub Actions Workflow**:
   - The workflow file is located at `.github/workflows/server-deploy.yml`
   - It automatically installs Doppler CLI and configures it with your service token
   - It runs tests, linting, and deploys to Deno Deploy
   - All steps have access to your Doppler secrets

5. **Deployment Process**:
   - The workflow runs on pushes to the main branch that affect server files
   - It runs tests, builds the application, and deploys it to Deno Deploy
   - The deployment is verified with a health check

## Secret Rotation and Management

### Best Practices for Secret Management

1. **Regular Rotation**:
   - Rotate database credentials every 30-90 days
   - Rotate API keys and service tokens according to their sensitivity
   - Use the Doppler dashboard to update secrets without changing code

2. **Environment Isolation**:
   - Keep development, staging, and production secrets separate
   - Use different Doppler configs for each environment
   - Limit access to production secrets to essential team members

3. **Access Control**:
   - Use service tokens with limited scope for CI/CD pipelines
   - Regularly audit access to your Doppler workspace
   - Revoke unused or compromised tokens immediately

4. **Secret Versioning**:
   - Doppler automatically versions your secrets
   - You can roll back to previous versions if needed
   - Review the audit log regularly for unexpected changes

## Troubleshooting

### Common Issues and Solutions

1. **Secrets Not Available in Environment**:
   - Verify Doppler is correctly installed: `doppler --version`
   - Check your configuration: `doppler configure`
   - Ensure you're using the correct project and config: `doppler run -- env | grep DOPPLER`

2. **CI/CD Pipeline Failures**:
   - Verify the service token is correctly set in GitHub Secrets
   - Check that the token has access to the required project and config
   - Review GitHub Actions logs for Doppler-related errors

3. **Local Development Issues**:
   - Run `doppler setup` to reconfigure your local environment
   - Try `doppler run -- env` to see all available environment variables
   - Check for conflicts with local environment variables

4. **Permission Errors**:
   - Ensure your Doppler account has access to the project
   - Verify service tokens have the correct permissions
   - Contact your Doppler workspace administrator if needed

## API Documentation

- `GET /health` - Health check endpoint
- `GET /` - API information
- Additional endpoints for groups, invitations, and number sets

## License

[MIT](LICENSE)
