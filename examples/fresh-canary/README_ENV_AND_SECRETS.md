# Environment Variables and Secrets Management

This guide explains how to properly manage environment variables and secrets when working with the WorkOS SDK in a Fresh application.

## Environment Variables Overview

The WorkOS SDK requires several environment variables for proper operation:

| Variable                | Description                              | Required           |
| ----------------------- | ---------------------------------------- | ------------------ |
| `WORKOS_API_KEY`        | Your WorkOS API key                      | Yes                |
| `WORKOS_CLIENT_ID`      | Your WorkOS client ID                    | Yes                |
| `SESSION_SECRET`        | Secret for encrypting session cookies    | Yes (for auth)     |
| `WORKOS_WEBHOOK_SECRET` | Secret for validating webhook signatures | Yes (for webhooks) |

## Local Development Setup

### Using a .env File

For local development, create a `.env` file in the root of your project:

```bash
# WorkOS credentials
WORKOS_API_KEY=sk_test_xxxxxxxxxxxx
WORKOS_CLIENT_ID=client_xxxxxxxxxxxx

# Session encryption (use a strong random string)
SESSION_SECRET=your_session_secret_at_least_32_chars_long

# Webhook verification (from WorkOS dashboard)
WORKOS_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Optional telemetry configuration
OTLP_ENDPOINT=http://localhost:4318
```

**IMPORTANT**: Never commit your `.env` file to version control. Add it to your `.gitignore` file:

```
# .gitignore
.env
```

### Loading Environment Variables

In Deno, load environment variables from your `.env` file:

```typescript
// main.ts
import { load } from 'https://deno.land/std/dotenv/mod.ts';

// Load environment variables from .env file
await load({ export: true });

// Now variables are available via Deno.env.get
console.log(Deno.env.get('WORKOS_API_KEY'));
```

## Production Deployment with Secrets

For production environments, you should not use `.env` files. Instead, use a secrets management system.

### Using Doppler (Recommended)

[Doppler](https://www.doppler.com/) is a secure secrets manager that works well with Deno applications.

1. Install the Doppler CLI:
   ```bash
   # macOS
   brew install dopplerhq/cli/doppler

   # Other platforms: see https://docs.doppler.com/docs/install-cli
   ```

2. Configure your project:
   ```bash
   doppler setup
   ```

3. Run your application with Doppler:
   ```bash
   doppler run -- deno task start
   ```

### Deno Deploy Integration

When deploying to Deno Deploy, configure environment variables through their dashboard:

1. Go to the [Deno Deploy dashboard](https://dash.deno.com/)
2. Select your project
3. Navigate to "Settings" > "Environment Variables"
4. Add each required variable
5. Save changes and redeploy

### GitHub Actions Integration

For CI/CD with GitHub Actions, store secrets in GitHub:

1. Go to your repository on GitHub
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Create new secrets for each environment variable
4. Reference them in your workflow file:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Deno Deploy
        uses: denoland/deployctl@v1
        with:
          project: your-project-name
          entrypoint: main.ts
        env:
          WORKOS_API_KEY: ${{ secrets.WORKOS_API_KEY }}
          WORKOS_CLIENT_ID: ${{ secrets.WORKOS_CLIENT_ID }}
          SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
          WORKOS_WEBHOOK_SECRET: ${{ secrets.WORKOS_WEBHOOK_SECRET }}
```

## Rotating and Managing Secrets

Follow these best practices for secret management:

1. **Regular rotation**: Change secrets periodically (especially SESSION_SECRET)
2. **Different secrets for environments**: Use different secrets for development, staging, and production
3. **Access control**: Limit who has access to production secrets
4. **Secret auditing**: Monitor and log access to secrets
5. **Secret versioning**: Version your secrets to make rotation easier

## Accessing Secrets in Code

When accessing secrets in your application code, use a consistent pattern:

```typescript
// utils/config.ts
export function getConfig() {
  return {
    workosApiKey: Deno.env.get('WORKOS_API_KEY') || '',
    workosClientId: Deno.env.get('WORKOS_CLIENT_ID') || '',
    sessionSecret: Deno.env.get('SESSION_SECRET') || '',
    webhookSecret: Deno.env.get('WORKOS_WEBHOOK_SECRET') || '',
    isProduction: Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined,
  };
}

// Then import and use this elsewhere
import { getConfig } from '../utils/config.ts';
const config = getConfig();
```

## Telemetry Configuration

When enabling telemetry, you can also configure the OpenTelemetry endpoint through environment variables:

```typescript
import { WorkOS } from '@workos/sdk';

const workos = new WorkOS(
  Deno.env.get('WORKOS_API_KEY') || '',
  {
    clientId: Deno.env.get('WORKOS_CLIENT_ID'),
    telemetry: {
      enabled: true,
      endpoint: Deno.env.get('OTLP_ENDPOINT') || 'http://localhost:4318',
      serviceName: Deno.env.get('SERVICE_NAME') || 'fresh-app',
      debug: Deno.env.get('TELEMETRY_DEBUG') === 'true',
    },
  },
);
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**: Verify that your `.env` file is in the root directory and properly formatted
2. **Permissions errors**: Ensure your Deno application has the `--allow-env` flag to access environment variables
3. **Secrets not available in deployments**: Check if your deployment platform correctly has the secrets configured

### Debugging Environment Variables

To debug environment variables, you can temporarily log them (NEVER in production code):

```typescript
console.log({
  apiKeySet: !!Deno.env.get('WORKOS_API_KEY'),
  clientIdSet: !!Deno.env.get('WORKOS_CLIENT_ID'),
  sessionSecretSet: !!Deno.env.get('SESSION_SECRET'),
  webhookSecretSet: !!Deno.env.get('WORKOS_WEBHOOK_SECRET'),
});
```

## Security Recommendations

1. **Never log the actual values** of secrets or API keys
2. **Set appropriate cookie settings** (httpOnly, secure, sameSite)
3. **Use HTTPS** for all production environments
4. **Implement proper CORS headers** to restrict which domains can access your API
5. **Set minimum permission scopes** for service accounts and API keys
