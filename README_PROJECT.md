# n8n AI Studio

**An owner-only AI Orchestrator Studio** with real-time action tracking, slash commands, and secure connector management.

## Features

### 🎯 Core Functionality
- **Chat Interface** - Conversational AI with message history
- **Slash Commands** - Execute orchestrator workflows with `/engineer`, `/workflow`, `/github`, `/deploy`, `/analyze`
- **Real-time Action Logs** - Live SSE streaming of orchestrator job actions
- **Connector Management** - Securely store and manage API tokens for GitHub, HuggingFace, and Vercel
- **Owner-Only Access** - Secure authentication with Manus OAuth

### 🔐 Security
- **Token Encryption** - AES-256-GCM encryption for all stored credentials
- **Secure Sessions** - HTTP-only cookies with JWT signing
- **Owner Verification** - Only project owner can access the studio
- **Input Validation** - All inputs validated and sanitized

### ⚡ Performance
- **Real-time Updates** - SSE streaming for live action logs
- **Optimistic Updates** - Instant UI feedback for user actions
- **Efficient Caching** - Smart query caching and database optimization
- **Code Splitting** - Lazy-loaded components for faster initial load

### 🛠️ Developer Experience
- **Type-Safe** - Full TypeScript support with tRPC end-to-end typing
- **Hot Module Reloading** - Instant feedback during development
- **Comprehensive Tests** - 27 passing unit and integration tests
- **Well-Organized** - Clean architecture with separation of concerns

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Tailwind CSS 4, Wouter (routing) |
| **Backend** | Express 4, tRPC 11, Drizzle ORM |
| **Database** | MySQL/TiDB |
| **Real-time** | Server-Sent Events (SSE) |
| **Authentication** | Manus OAuth 2.0 |
| **Testing** | Vitest, Chai |
| **Build** | Vite, pnpm |

## Project Structure

```
n8n-ai-studio/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── ChatPage.tsx        # Main chat interface
│   │   │   ├── ConnectorsPage.tsx  # API connector management
│   │   │   └── SettingsPage.tsx    # User settings
│   │   ├── components/             # Reusable UI components
│   │   │   ├── DashboardLayout.tsx # Main layout with sidebar
│   │   │   ├── ActionLogViewer.tsx # Real-time action logs
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── lib/
│   │   │   └── trpc.ts             # tRPC client setup
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # Entry point
│   └── public/                     # Static assets
├── server/                          # Express backend
│   ├── routers.ts                  # tRPC procedure definitions
│   ├── routers.test.ts             # Integration tests
│   ├── db.ts                       # Database helpers
│   ├── services/                   # Business logic
│   │   ├── encryptionService.ts    # Token encryption
│   │   ├── encryptionService.test.ts
│   │   ├── orchestratorService.ts  # Orchestrator proxy
│   │   └── orchestratorService.test.ts
│   ├── _core/                      # Framework plumbing
│   │   ├── context.ts              # tRPC context
│   │   ├── trpc.ts                 # tRPC setup
│   │   ├── streamingEndpoint.ts    # SSE endpoint
│   │   ├── oauth.ts                # OAuth flow
│   │   ├── llm.ts                  # LLM integration
│   │   ├── env.ts                  # Environment variables
│   │   └── index.ts                # Express app setup
│   └── auth.logout.test.ts         # Auth tests
├── drizzle/                         # Database schema
│   └── schema.ts                   # Table definitions
├── shared/                          # Shared types
├── storage/                         # S3 helpers
├── DEPLOYMENT.md                    # Deployment guide
├── package.json                     # Dependencies
└── todo.md                         # Project checklist
```

## Getting Started

### Prerequisites
- Node.js 22.13.0+
- pnpm 9.0.0+
- MySQL/TiDB database

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm tsc --noEmit
```

The application will be available at `http://localhost:3000`

### Environment Variables

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete environment variable documentation.

## Key Features Explained

### Chat Interface
- Send messages to the AI orchestrator
- View conversation history
- Type `/` to access slash commands
- Real-time action log updates while commands execute

### Slash Commands
- **`/engineer`** - Create a new project with code generation
- **`/workflow`** - Design and deploy a workflow
- **`/github`** - Manage GitHub repositories
- **`/deploy`** - Deploy to production
- **`/analyze`** - Analyze code and provide insights

### Connector Management
Securely store API tokens for:
- **GitHub** - Repository management and automation
- **HuggingFace** - Model access and fine-tuning
- **Vercel** - Deployment and project management

Tokens are encrypted with AES-256-GCM and only decrypted when needed.

### Real-time Action Logs
- Live streaming of orchestrator job actions
- Status indicators (pending, running, success, error)
- Auto-scrolling to latest actions
- Connection status indicator
- Auto-reconnect on connection loss

## API Reference

### tRPC Procedures

#### Chat
- `chat.getHistory(conversationId, limit)` - Get conversation history
- `chat.sendMessage(conversationId, role, content)` - Save a message

#### Connectors
- `connectors.list()` - Get all connectors for the user
- `connectors.save(type, name, token)` - Save a connector
- `connectors.delete(connectorId)` - Delete a connector

#### Orchestrator
- `orchestrator.invoke(goal, action, params)` - Invoke an orchestrator workflow

#### Auth
- `auth.me()` - Get current user info
- `auth.logout()` - Logout current user

#### System
- `system.notifyOwner(title, content)` - Send notification to owner

### SSE Endpoint
- `GET /api/stream/actions/:jobId` - Stream action logs for a job

## Testing

### Run All Tests
```bash
pnpm test
```

### Run Specific Test File
```bash
pnpm test server/services/encryptionService.test.ts
```

### Test Coverage
- **Encryption Service** - 7 tests covering encryption/decryption
- **Orchestrator Service** - 7 tests covering retry logic and error handling
- **Auth** - 1 test for logout functionality
- **Integration** - 12 tests for tRPC procedures

## Deployment

### Quick Deploy (Manus)
1. Click **Publish** in Manus Management UI
2. Configure custom domain (optional)
3. Deploy

### External Hosting
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions for Vercel, Railway, Render, etc.

## Troubleshooting

### Development Issues

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

**Database connection failed:**
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Ensure network connectivity

**Tests failing:**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm test
```

### Production Issues
See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for production troubleshooting.

## Contributing

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules (configured in `package.json`)
- Use Prettier for code formatting
- Write tests for new features

### Adding Features
1. Update `todo.md` with new feature
2. Create feature branch
3. Implement feature with tests
4. Update documentation
5. Create pull request

## Performance Tips

### Frontend
- Use React DevTools Profiler to identify slow components
- Check Network tab for large bundle sizes
- Use Lighthouse for performance audits

### Backend
- Monitor database query performance
- Use database indexes for frequently queried columns
- Cache expensive computations

### Deployment
- Enable gzip compression
- Use CDN for static assets
- Set appropriate cache headers
- Monitor resource usage

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Server-side validation is essential
3. **Use HTTPS** - Always in production
4. **Keep dependencies updated** - Regular security patches
5. **Monitor logs** - Watch for suspicious activity
6. **Rotate credentials** - Regularly update API keys

## Support & Resources

- **Documentation** - See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues** - Report bugs in GitHub issues
- **Discussions** - Ask questions in GitHub discussions
- **Manus Support** - https://help.manus.im

## License

This project is provided as-is for use with the Manus platform.

## Changelog

### Version 1.0.0 (Current)
- ✅ Chat interface with message history
- ✅ Slash command palette with keyboard navigation
- ✅ Real-time action log streaming
- ✅ Secure connector management
- ✅ Owner-only authentication
- ✅ 27 passing tests
- ✅ Production-ready deployment

---

**Built with ❤️ using Manus**
