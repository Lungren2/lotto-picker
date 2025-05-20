# Deployment Documentation

This document provides information about deploying the Oddly lottery application.

## Table of Contents

- [CI/CD Setup](#cicd-setup)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](./environment-variables.md)
- [Troubleshooting](#troubleshooting)

## CI/CD Setup

The application uses GitHub Actions for continuous integration and deployment. The workflows are configured to deploy:

- Client application to Netlify
- Server application to Deno Deploy

### Workflow Files

- `.github/workflows/client-deploy.yml`: Deploys the client to Netlify
- `.github/workflows/server-deploy.yml`: Deploys the server to Deno Deploy

### Workflow Triggers

Both workflows are triggered when:

1. Changes are pushed to the `main` branch in their respective directories
2. Pull requests are opened against the `main` branch with changes in their respective directories
3. The workflow is manually triggered via GitHub Actions UI

### Initial Setup

1. Configure all required [environment variables](./environment-variables.md) in GitHub repository settings
2. Ensure you have accounts and appropriate permissions on:
   - Netlify for client deployment
   - Deno Deploy for server deployment
   - Doppler for server environment variables
3. For the first deployment, you may need to manually trigger the workflows

## Manual Deployment

### Client (React Application)

To manually deploy the client:

```bash
# Navigate to client directory
cd client

# Install dependencies
pnpm install

# Generate PWA assets
pnpm generate-pwa-assets

# Build for production
pnpm build

# Deploy to Netlify (if Netlify CLI is installed)
netlify deploy --prod
```

### Server (Deno Application)

To manually deploy the server:

```bash
# Navigate to server directory
cd server

# Run tests
deno test --allow-net --allow-env

# Deploy to Deno Deploy (if deployctl is installed)
deployctl deploy --project=your-project-name --token=your-token main.ts
```

## Troubleshooting

### Common Issues

#### Client Deployment Failures

- **Build Errors**: Check the build logs for syntax errors or missing dependencies
- **Environment Variables**: Ensure all required environment variables are set in GitHub secrets
- **Netlify Configuration**: Verify the `netlify.toml` file is correctly configured

#### Server Deployment Failures

- **Deno Deploy Errors**: Check for compatibility issues with Deno Deploy
- **Database Connection**: Ensure the database connection string is correct
- **Doppler Configuration**: Verify that Doppler is correctly configured and the token is valid

### Debugging Deployments

- Review the GitHub Actions logs for detailed error information
- Test deployments locally before pushing to GitHub
- Use the `workflow_dispatch` trigger to manually run workflows for testing
