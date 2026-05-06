# PES War Room — Competitor Intelligence Dashboard

AI-powered competitive intelligence system for **Practical EduSkills** vs **Nilaya Education**.

---

## What It Does

The founder opens the dashboard, clicks **"Analyze Today"**, and within minutes receives:

- Live Meta Ads Library data for both brands
- Instagram, YouTube, LinkedIn, Facebook follower counts & activity
- Website scrape: CTAs, pricing, placement claims, trust signals
- Claude AI analysis: SWOT, scores (9 dimensions), daily battle report
- Jarvis AI chat: ask anything, get strategic answers
- PDF + Excel report download

**No database. No permanent storage. Session-only.**

---

## Architecture

```
competitor-intelligence/
├── backend/                    # Python FastAPI + Agno + Claude
│   └── app/
│       ├── main.py             # FastAPI entry point
│       ├── config.py           # Settings (pydantic-settings)
│       ├── models/schemas.py   # All Pydantic models
│       ├── scrapers/           # Playwright-based scrapers
│       │   ├── base.py
│       │   ├── meta_ads.py
│       │   ├── instagram.py
│       │   ├── youtube.py
│       │   ├── linkedin.py
│       │   └── website.py
│       ├── agents/             # AI agents
│       │   ├── ads_intelligence.py
│       │   ├── social_media.py
│       │   ├── strategy.py
│       │   └── jarvis.py
│       ├── services/
│       │   ├── cache_service.py    # In-memory session store
│       │   ├── claude_service.py   # Claude API client
│       │   ├── analysis_service.py # Orchestrator
│       │   └── report_service.py   # PDF + Excel generation
│       └── api/routes/
│           ├── auth.py
│           ├── analysis.py
│           ├── chat.py
│           ├── export.py
│           └── alerts.py
└── frontend/                   # Next.js 15 + TypeScript + Tailwind
    └── src/
        ├── app/
        │   ├── page.tsx            # Login page
        │   └── dashboard/page.tsx  # Main dashboard
        ├── components/
        │   ├── layout/             # Sidebar, Header
        │   ├── dashboard/          # 10 analytical components
        │   └── jarvis/             # AI chat interface
        ├── hooks/                  # useAnalysis, useJarvis
        ├── lib/                    # api.ts, store.ts, utils.ts
        └── types/index.ts
```

---

## Quick Start (Local)

### 1. Clone the repo
```bash
git clone https://github.com/your-org/competitor-intelligence.git
cd competitor-intelligence
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m playwright install chromium

cp .env.example .env
# Edit .env with your keys
```

### 3. Start backend
```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env.local
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Start frontend
```bash
npm run dev
```

Open: http://localhost:3000

---

## Environment Variables

### Backend (.env)
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com |
| `FOUNDER_PASSWORD` | Password to access the dashboard |
| `SECRET_KEY` | JWT signing secret (32+ chars) |

Generate a secret key:
```python
python -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend (.env.local)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (http://localhost:8000 or Railway URL) |

---

## Deploy to Production

### Backend → Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select the `backend/` folder
4. Set environment variables:
   - `ANTHROPIC_API_KEY`
   - `FOUNDER_PASSWORD`
   - `SECRET_KEY`
5. Railway auto-detects the `Dockerfile`
6. Copy your Railway URL (e.g. `https://pes-api.railway.app`)

### Frontend → Vercel

1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Set environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway URL
5. Deploy

---

## Dashboard Modules

| Module | Description |
|---|---|
| War Room Overview | High-level battlefield summary |
| Ad Intelligence | Meta Ads Library tracker, ad copy samples |
| Social Intel | Cross-platform follower & engagement comparison |
| Website Intel | CTA, pricing, placement claims scrape |
| Funnel Map | Awareness → Conversion comparison |
| Competitor Scores | 9-dimension radar chart scoring |
| Strategy Engine | SWOT, recommendations, campaign ideas |
| AI Alerts | Real-time competitor threat detection |
| Jarvis AI | Strategic chat assistant |
| Export Reports | PDF & Excel download |

---

## Jarvis Sample Prompts

```
"Why is Nilaya ahead of us right now?"
"What ads are performing for the competitor?"
"Give me 5 viral reel ideas for placement courses"
"Generate a counter campaign for their current ads"
"What are their biggest weaknesses we can exploit?"
"Analyze our funnel vs their funnel"
"Predict what campaign they'll launch next"
"Write 3 WhatsApp broadcast messages for our next batch"
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, uvicorn |
| AI | Anthropic Claude (claude-opus-4-5), Agno agents |
| Scraping | Playwright (Chromium), BeautifulSoup, httpx |
| Search fallback | DuckDuckGo Search |
| PDF | ReportLab |
| Excel | openpyxl |
| Auth | JWT (python-jose), bcrypt |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| State | Zustand |
| Charts | Recharts |
| Animation | Framer Motion |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Security Notes

- The dashboard is password-protected (single founder password)
- All sessions are in-memory; no data persists after session expiry (8 hours)
- ANTHROPIC_API_KEY is server-side only — never exposed to frontend
- Rate limiting enabled on all API endpoints
- CORS restricted to configured origins in production

---

*Built for Practical EduSkills — Founder Intelligence System*
