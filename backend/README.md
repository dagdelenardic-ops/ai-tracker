# AI Tracker Backend

Node.js + Express API for AI Tracker dashboard.

## Setup

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your X API credentials:

```bash
cp .env.example .env
```

## Running

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tools` | List all AI tools |
| GET | `/api/tools?category=chatbots` | Filter by category |
| GET | `/api/tools/categories` | List categories |
| GET | `/api/tools/with-tweets` | Tools with recent tweets |
| GET | `/api/tools/timeline` | All tweets timeline |
| GET | `/api/tools/:id` | Get single tool |
| GET | `/api/tools/search/:query` | Search tools |
| GET | `/api/stats` | Dashboard stats |

## Categories

- `chatbots` - Chatbots & LLMs
- `image` - Image Generation
- `video` - Video Generation
- `audio` - Audio & Music
- `coding` - Coding
- `productivity` - Productivity
