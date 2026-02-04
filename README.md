# Agora Conversational AI Web Demo

Real-time voice conversation with AI agents, featuring live transcription and log monitoring.

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Configure backend
cd server-python
cp .env.example .env.local
# Edit .env.local with your Agora credentials

# 3. Start services
cd ..
bun run dev
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Configuration

Edit `server-python/.env.local`:

```bash
APP_ID=your_app_id
APP_CERTIFICATE=your_certificate
API_KEY=your_customer_id
API_SECRET=your_customer_secret
```

See `server-python/.env.example` for LLM and TTS configurations.

## Commands

```bash
bun run dev          # Start both services
bun run backend      # Backend only
bun run frontend     # Frontend only
bun run build        # Build for production
bun run clean        # Clean artifacts
```

## Troubleshooting

**Connection issues**: Verify backend is running on port 8000  
**Auth errors**: Check credentials in `.env.local`  
**Agent fails**: Review logs at http://localhost:8000/docs

## Documentation

- [AGENTS.md](./AGENTS.md) - Architecture & development guide
- [web-client/](./web-client/) - Frontend details
- [server-python/](./server-python/) - Backend details
