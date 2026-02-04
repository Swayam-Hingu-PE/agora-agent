# Agora Conversational AI Web Demo - Architecture

## Overview

A web demo showcasing quick integration of Agora Conversational AI, featuring real-time voice conversation, subtitle rendering, and log monitoring.

> **Note**: For AI workflow rules and project specifications, see [AGENTS.md](./AGENTS.md)

## Tech Stack

### Frontend

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| RTC SDK | agora-rtc-sdk-ng |
| RTM SDK | agora-rtm |

### Backend

| Category | Technology |
|----------|------------|
| Framework | FastAPI |
| Language | Python 3 |
| HTTP Client | requests |
| Token Builder | agora-token (custom) |

## Project Structure

```
.
├── src/                     # Frontend source
│   ├── components/          # UI components
│   │   ├── App.tsx          # Main application entry
│   │   ├── SubtitlePanel.tsx    # Subtitle rendering module
│   │   ├── LogPanel.tsx         # Log display module
│   │   └── ControlBar.tsx       # Control buttons (start/stop/mic)
│   ├── stores/              # State management
│   │   └── app-store.ts     # Zustand store
│   ├── services/            # Service layer
│   │   ├── api.ts           # Backend API calls (get_config, startAgent, stopAgent)
│   │   └── agora-service.ts # RTC/RTM integration
│   ├── conversational-ai-api/   # Subtitle rendering core module
│   │   ├── index.ts
│   │   ├── type.ts
│   │   └── utils/
│   ├── lib/                 # Utility libraries
│   │   ├── logger.ts        # Logger utility
│   │   └── utils.ts         # Common utility functions
│   ├── config/
│   │   └── env.ts           # Environment configuration
│   └── main.tsx             # Application entry point
│
├── ../server-python/        # Backend service (project root level)
│   ├── src/
│   │   ├── server.py        # FastAPI entry, route definitions
│   │   └── agent.py         # Agent class (generate_config, start, stop)
│   ├── requirements.txt     # Python dependencies
│   └── .env.local           # Backend environment variables
│
├── vite.config.ts           # Vite configuration (includes API proxy)
└── package.json             # Frontend dependencies + scripts
```

## Core Modules

### 1. SubtitlePanel (Subtitle Rendering)

- Real-time display of user and AI Agent conversation
- Distinct styling for user/agent messages
- Auto-scroll to latest message
- Message status display (in-progress/completed/interrupted)

### 2. LogPanel (Log Display)

- System runtime logs
- Log level support (info/success/error/warning)
- Timestamp display
- Collapsible/expandable

### 3. ControlBar (Control Bar)

- Start/Stop Agent button
- Microphone toggle button
- Connection status indicator

## Data Flow

```
User Action → Zustand Store → Service Layer → Agora SDK
                   ↓
              UI Components ← ConversationalAIAPI Events
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/get_config | GET | Generate connection config (token, channel, UIDs) |
| /api/v2/startAgent | POST | Start Conversational AI Agent |
| /api/v2/stopAgent | POST | Stop Agent |

### Request/Response Examples

#### GET /api/get_config
```json
// Response
{
  "code": 0,
  "msg": "success",
  "data": {
    "app_id": "your_app_id",
    "token": "007eJxT...",
    "uid": "123456",
    "channel_name": "channel_1234567890",
    "agent_uid": "12345678"
  }
}
```

#### POST /api/v2/startAgent
```json
// Request
{
  "channelName": "test-channel",
  "rtcUid": "12345678",
  "userUid": "123456"
}

// Response
{
  "code": 0,
  "msg": "success",
  "data": {
    "agent_id": "abc-123-def",
    "channel_name": "test-channel",
    "status": "started"
  }
}
```

#### POST /api/v2/stopAgent
```json
// Request
{
  "agentId": "abc-123-def"
}

// Response
{
  "code": 0,
  "msg": "success"
}
```

## Backend Architecture

### Python Service (FastAPI)

```
../server-python/
├── src/
│   ├── server.py        # FastAPI app, routes, CORS
│   └── agent.py         # Agent 启动/停止逻辑
└── requirements.txt     # Python 依赖
```

### Environment Variables

Backend reads configuration from `server-python/.env.local`:

| Variable | Description |
|----------|-------------|
| APP_ID | Agora App ID |
| APP_CERTIFICATE | Agora App Certificate |
| API_KEY | Agora RESTful API Key (Customer ID) |
| API_SECRET | Agora RESTful API Secret (Customer Secret) |
| ASR_DEEPGRAM_API_KEY | Deepgram ASR API Key |
| LLM_API_KEY | OpenAI LLM API Key |
| TTS_ELEVENLABS_API_KEY | ElevenLabs TTS API Key |
| PORT | Backend server port (default: 8000) |

### Proxy Configuration

Vite dev server proxies `/api/*` requests to Python backend (port 8000):

```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

## State Management (Zustand)

```typescript
interface AppState {
  // Connection
  isConnected: boolean
  isConnecting: boolean
  channelName: string
  
  // Agent
  agentId: string | null
  agentState: EAgentState
  
  // Audio
  isMicMuted: boolean
  
  // Transcripts
  transcripts: TranscriptItem[]
  
  // Logs
  logs: LogItem[]
}
```

## Event Flow

1. User clicks connect → Call `/api/get_config` to get configuration
2. Initialize RTC/RTM Engine
3. Use returned token to login RTM → Join RTC channel
4. Initialize ConversationalAIAPI
5. Call `/api/v2/startAgent` to start Agent
6. Listen to subtitle events → Update UI
7. User clicks stop → Call `/api/v2/stopAgent` → Cleanup resources
