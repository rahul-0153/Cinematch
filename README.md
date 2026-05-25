# 🎬 CineMatch — AI-Powered Movie Recommender

> Find the perfect film for *this exact moment* — not based on watch history, but on how you feel right now.

## Features

- **Mood Quiz** — 10 questions about your current mood, available time, company, preferences → 5 personalized movie recommendations
- **AI Chatbot** — Conversational movie search with full context memory ("something like Fight Club but funnier", "Brad Pitt movies where he plays a villain")
- **Rich Movie Data** — Posters, ratings, cast via TMDB API
- **Multi-turn Chat** — Session-based conversation history so the AI remembers context

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + React Router |
| Backend | Node.js + Express |
| AI | Claude API (Anthropic) |
| Movie Data | TMDB API |
| Animations | CSS keyframes + Framer Motion |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Local Setup

### 1. Clone and install

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in your keys

# Frontend
cd ../frontend
npm install
cp .env.example .env   # set VITE_API_URL
```

### 2. Get API Keys

**Anthropic (Claude API)**
1. Go to https://console.anthropic.com
2. Create an API key
3. Add to `backend/.env` as `ANTHROPIC_API_KEY`

**TMDB (Movie Data) — Free**
1. Go to https://www.themoviedb.org/signup
2. Settings → API → Request API Key
3. Add to `backend/.env` as `TMDB_API_KEY`

> Note: App works without TMDB key — you'll just see movie titles without posters.

### 3. Run locally

```bash
# Terminal 1: Backend
cd backend
npm run dev          # runs on :3001

# Terminal 2: Frontend
cd frontend
npm run dev          # runs on :5173
```

Open `http://localhost:5173`

---

## Deployment

### Backend → Render (free tier)

1. Push to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo, select `backend/` as root
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables in Render dashboard
7. Copy your Render URL (e.g. `https://cinematch-api.onrender.com`)

### Frontend → Vercel

1. Go to https://vercel.com → New Project
2. Import your repo, select `frontend/` as root
3. Add environment variable: `VITE_API_URL=https://your-render-url.onrender.com`
4. Deploy

---

## Project Structure

```
cinematch/
├── backend/
│   ├── server.js          # Express API server
│   ├── .env.example       # Environment variables template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx          # Landing page
    │   │   ├── Questionnaire.jsx # 10-question mood quiz
    │   │   ├── Results.jsx       # Recommendation results grid
    │   │   └── Chat.jsx          # AI chatbot interface
    │   ├── components/
    │   │   ├── Nav.jsx           # Navigation bar
    │   │   └── MovieCard.jsx     # Movie card component
    │   ├── App.jsx               # Router setup
    │   ├── main.jsx
    │   └── index.css             # Global styles
    └── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recommend` | Takes 10 quiz answers, returns 5 movies |
| POST | `/api/chat` | Sends chat message, returns AI reply + movies |
| POST | `/api/chat/reset` | Clears conversation session |

### Example: /api/recommend

```json
// Request
{
  "answers": [
    { "question": "How would you describe your mood?", "answer": "Happy & energetic" },
    ...
  ]
}

// Response
{
  "movies": [
    {
      "title": "The Grand Budapest Hotel",
      "year": 2014,
      "director": "Wes Anderson",
      "cast": ["Ralph Fiennes", "Tony Revolori"],
      "genres": ["Comedy", "Drama"],
      "why": "Your energetic mood pairs perfectly with Wes Anderson's visual wit...",
      "mood_tags": ["quirky", "feel-good", "stylish"],
      "poster": "https://image.tmdb.org/t/p/w500/...",
      "rating": "8.1"
    }
  ]
}
```

---
