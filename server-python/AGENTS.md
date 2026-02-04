# Agora Agent Service - AI Assistant Guide

This document is designed for AI programming assistants to understand and work with this project effectively.

## Project Overview

**Purpose:** FastAPI-based service for managing Agora Conversational AI Agents

**Tech Stack:**
- Python 3.8+
- FastAPI (web framework)
- agora-rest-client-python (Agora SDK)
- uvicorn (ASGI server)

**Architecture:**
```
HTTP Request → FastAPI (server.py) → Agent (agent.py) → AgentManager (SDK) → Agora API
```

**Key Components:**
- `src/server.py` - HTTP endpoints and request handling
- `src/agent.py` - Business logic wrapper around SDK
- SDK handles token generation, API calls, and configuration

## Build and Test Commands

### Setup
```bash
# First time setup
cp .env.example .env.local
# Edit .env.local with actual API keys

# Install dependencies
pip install -r requirements.txt
```

### Run
```bash
# Development (simple)
python src/server.py

# Development (auto-reload)
uvicorn src.server:app --host 0.0.0.0 --port 8000 --reload

# Production
gunicorn src.server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Test
```bash
# Test config generation
curl http://localhost:8000/get_config

# Test agent start
curl -X POST http://localhost:8000/v2/startAgent \
  -H "Content-Type: application/json" \
  -d '{"channelName": "test", "rtcUid": "123", "userUid": "456"}'

# Test agent stop
curl -X POST http://localhost:8000/v2/stopAgent \
  -H "Content-Type: application/json" \
  -d '{"agentId": "agent_id"}'
```

## Code Style Guidelines

### Python Conventions
- **Style:** PEP 8
- **Type hints:** Required for all function parameters and return values
- **Imports:** Absolute imports preferred, group by standard/third-party/local
- **Line length:** 100 characters max

### Naming
- Functions/variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private: prefix with `_`

### Comments
- Keep docstrings concise and natural
- Avoid obvious comments
- Focus on "why" not "what"
- No AI-generated style comments (e.g., "This function does X")

### Code Organization
```python
# Good
def start_agent(channel: str, uid: str) -> dict:
    """Start agent in channel"""
    if not channel:
        raise ValueError("channel is required")
    return manager.start(channel, uid)

# Avoid
def start_agent(channel: str, uid: str) -> dict:
    """
    Start Conversational AI Agent in a channel
    
    Args:
        channel: The channel name for the agent
        uid: The user ID for the agent
        
    Returns:
        Dictionary containing agent information
    """
    # Validate channel parameter
    if not channel:
        # Raise error if channel is empty
        raise ValueError("channel is required")
    # Call manager to start agent
    return manager.start(channel, uid)
```

## Testing Instructions

### Manual Testing
1. Start service: `python src/server.py`
2. Test each endpoint with curl commands (see above)
3. Verify response format matches expected structure

### Expected Responses
```python
# Success
{"code": 0, "msg": "success", "data": {...}}

# Error (FastAPI)
{"detail": "Error message"}
```

### Common Test Scenarios
- Missing environment variables → 500 error on startup
- Invalid parameters → 400 error
- Agent not found → 404 error
- API call failure → 500 error

## Security Considerations

### Environment Variables
- **Never commit** `.env.local` or actual API keys
- Use `.env.example` as template only
- All secrets must be loaded from environment

### API Keys Required
- `APP_ID`, `APP_CERTIFICATE` - Agora credentials
- `API_KEY`, `API_SECRET` - Agora REST API auth
- `LLM_API_KEY` - OpenAI API key
- `TTS_ELEVENLABS_API_KEY` - ElevenLabs API key
- `ASR_DEEPGRAM_API_KEY` - Deepgram API key

### Input Validation
- All user inputs are validated before processing
- Empty strings are rejected with `ValueError`
- Type validation handled by Pydantic models

### Error Handling
- Exceptions are caught and converted to appropriate HTTP errors
- Sensitive information is not exposed in error messages
- Use generic error messages for production

## Project Structure

```
python-agent/
├── src/
│   ├── server.py          # FastAPI app, HTTP endpoints
│   └── agent.py           # Business logic wrapper
├── .env.example           # Environment template (safe to commit)
├── .env.local            # Actual secrets (never commit)
├── requirements.txt       # Python dependencies
├── README.md             # User documentation
└── AGENTS.md             # This file (AI assistant guide)
```

## Common Patterns

### Adding New Endpoint
1. Define Pydantic model for request body
2. Add route handler function
3. Validate inputs
4. Call agent method
5. Return standardized response format

### Error Handling Pattern
```python
try:
    result = agent.some_method()
    return {"code": 0, "msg": "success", "data": result}
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except RuntimeError as e:
    raise HTTPException(status_code=500, detail=str(e))
```

### Configuration Pattern
```python
# Load from environment
config = AgentConfig.from_env()

# Build service configs
asr = ASRConfig()
asr.api_key = config.deepgram_api_key

llm = LLMConfig()
llm.api_key = config.llm_api_key
```

## Dependencies

### Core
- `fastapi>=0.100.0` - Web framework
- `uvicorn>=0.20.0` - ASGI server
- `agora-rest-client-python>=0.1.0` - Agora SDK
- `python-dotenv>=1.0.0` - Environment management

### Update Strategy
- Check for security updates regularly
- Test in development before updating production
- Pin major versions, allow minor/patch updates

## Troubleshooting

### Import Errors
**Symptom:** `ModuleNotFoundError: No module named 'agora_rest'`
**Solution:** `pip install agora-rest-client-python`

### Configuration Errors
**Symptom:** Service fails to start with ValueError
**Solution:** Check `.env.local` exists and contains all required variables

### Port Conflicts
**Symptom:** `address already in use`
**Solution:** Change `PORT` in `.env.local` or kill existing process with `lsof -ti :8000 | xargs kill -9`

## AI Assistant Tips

When modifying this project:
1. Maintain consistent error handling patterns
2. Keep response format standardized
3. Validate all inputs before processing
4. Use type hints for all new functions
5. Follow existing code style (concise, natural comments)
6. Test changes with curl commands before committing
7. Never expose API keys in code or logs
