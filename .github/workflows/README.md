# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Oddly lottery application.

## Workflows

- `client-deploy.yml`: Deploys the client application to Netlify
- `server-deploy.yml`: Deploys the server application to Deno Deploy

## Environment Variables and Secrets

### Client Deployment
- `NETLIFY_AUTH_TOKEN`: Authentication token for Netlify
- `NETLIFY_SITE_ID`: ID of the Netlify site

### Server Deployment
- `DOPPLER_TOKEN`: Authentication token for Doppler
- `DENO_DEPLOY_TOKEN`: Authentication token for Deno Deploy
- `DENO_PROJECT`: Name of the Deno Deploy project

## Workflow Triggers

Both workflows are configured to run only when changes are made to their respective directories:

- Client workflow: Runs when changes are made to files in the `client/` directory
- Server workflow: Runs when changes are made to files in the `server/` directory

This prevents unnecessary deployments when changes are made to unrelated files.
