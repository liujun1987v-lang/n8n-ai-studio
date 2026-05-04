# n8n AI Studio - Deployment Guide

## Overview

The **n8n AI Studio** is a production-ready web application built with React 19, Express 4, tRPC 11, and Tailwind CSS 4. It provides an owner-only AI Orchestrator interface with real-time action tracking, slash commands, and secure connector management.

## Deployment Options

### Option 1: Manus Built-in Hosting (Recommended)

The application is pre-configured for Manus built-in hosting with automatic deployment and custom domain support.

**Steps:**
1. Click the **Publish** button in the Manus Management UI
2. Select your custom domain or use the auto-generated `*.manus.space` domain
3. The application will be deployed automatically

**Features:**
- Automatic SSL/TLS certificates
- Global CDN distribution
- Automatic scaling
- Built-in analytics and monitoring
- One-click rollback to previous versions

### Option 2: External Hosting (Vercel, Railway, Render)

If you prefer external hosting, follow these steps:

#### Prerequisites
- Git repository (GitHub, GitLab, etc.)
- Hosting account (Vercel, Railway, Render, etc.)

#### Steps

1. **Export to GitHub:**
   - Open Manus Management UI → Settings → GitHub
   - Click "Export to GitHub"
   - Select repository owner and name
   - Click "Export"

2. **Deploy to Vercel:**
   ```bash
   # Clone your exported repository
   git clone https://github.com/YOUR_USERNAME/n8n-ai-studio.git
   cd n8n-ai-studio

   # Deploy with Vercel CLI
   npm install -g vercel
   vercel
   ```

3. **Deploy to Railway or Render:**
   - Connect your GitHub repository to Railway/Render dashboard
   - Set environment variables (see below)
   - Deploy

## Environment Variables

The application requires the following environment variables:

### System-Provided (Manus)
These are automatically injected by Manus and should not be manually configured:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session cookie signing secret |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL |
| `OWNER_OPEN_ID` | Owner's Manus Open ID |
| `OWNER_NAME` | Owner's display name |
| `BUILT_IN_FORGE_API_URL` | Manus built-in APIs endpoint |
| `BUILT_IN_FORGE_API_KEY` | Server-side API key for Manus services |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend API key for Manus services |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend endpoint for Manus services |

### Application-Specific

| Variable | Default | Purpose |
|----------|---------|---------|
| `ORCHESTRATOR_URL` | `https://n8n-ai-orchestrator-production.workers.dev` | n8n AI Orchestrator Cloudflare Worker URL |
| `VITE_APP_TITLE` | `n8n AI Studio` | Application title (shown in UI) |
| `VITE_APP_LOGO` | (default logo) | Application logo URL |

## Database Schema

The application automatically creates the following tables on first deployment:

- **chat_messages** - Stores conversation history
- **connectors** - Stores encrypted API tokens for GitHub, HuggingFace, Vercel
- **action_logs** - Tracks orchestrator job actions and status
- **users** - Manus OAuth user records

Migrations are automatically applied during deployment.

## Security Considerations

### Authentication
- **Owner-Only Access:** Only the project owner (identified by `OWNER_OPEN_ID`) can access the studio
- **Session Management:** Secure HTTP-only cookies with JWT signing
- **OAuth:** Manus OAuth 2.0 integration for user authentication

### Data Protection
- **Token Encryption:** All API tokens are encrypted with AES-256-GCM before storage
- **HTTPS:** All traffic is encrypted in transit
- **CORS:** Configured to allow only trusted origins

### API Security
- **Rate Limiting:** Built-in rate limiting on tRPC procedures
- **Input Validation:** All inputs are validated and sanitized
- **SQL Injection Prevention:** Uses parameterized queries via Drizzle ORM

## Monitoring & Logs

### Manus Dashboard
- **Analytics:** View page views, unique visitors, and traffic patterns
- **Logs:** Access application logs, database queries, and error traces
- **Performance:** Monitor response times and resource usage
- **Alerts:** Set up notifications for errors and performance issues

### Local Development
```bash
# View dev server logs
pnpm dev

# Run tests
pnpm test

# Type check
pnpm tsc --noEmit
```

## Rollback

### Manus Hosting
1. Open Management UI → Dashboard → Version History
2. Click "Rollback" on a previous checkpoint
3. Confirm the rollback

### External Hosting
Refer to your hosting provider's documentation for rollback procedures.

## Troubleshooting

### "Connection refused" errors
- Verify `DATABASE_URL` is correct and database is accessible
- Check network connectivity and firewall rules

### "OAuth callback failed"
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL` are correct
- Ensure redirect URI matches Manus OAuth configuration

### "Orchestrator invocation failed"
- Verify `ORCHESTRATOR_URL` is accessible
- Check network connectivity to Cloudflare Workers
- Review action logs for detailed error messages

### "Token encryption failed"
- Verify `JWT_SECRET` is set and consistent across all instances
- Check that the encryption service has proper permissions

## Performance Optimization

### Frontend
- Vite with HMR for fast development
- Code splitting and lazy loading
- Tailwind CSS with PurgeCSS for minimal bundle size

### Backend
- tRPC with automatic type inference
- Database query optimization with Drizzle ORM
- Connection pooling for database efficiency
- SSE for real-time updates without polling

### Caching
- Browser caching with proper Cache-Control headers
- CDN caching for static assets
- Database query result caching where applicable

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs in Manus Dashboard
3. Contact Manus support at https://help.manus.im

## Additional Resources

- [Manus Documentation](https://docs.manus.im)
- [tRPC Documentation](https://trpc.io)
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
