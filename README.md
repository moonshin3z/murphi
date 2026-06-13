# Murphi 🌙

**An AI-powered finance & productivity assistant for students living away from home.**

Moving out for college means managing your own money, deadlines, and routines 
overnight — usually with no system at all. I built Murphi to solve my own 
version of that problem as a student in Guatemala.

## What makes it interesting

🤖 **An AI agent, not a chatbot.** Murphi's assistant uses Claude with tool 
use: tell it *"I spent Q50 on lunch"* or *"remind me to finish the physics 
lab by Friday"* in plain Spanish, and it registers the transaction or creates 
the task — no forms.

⚡ **Hybrid smart routing.** Common questions ("how much did I spend on food 
this month?") are answered by a deterministic rules engine with zero LLM 
cost; only complex requests escalate to Claude with tools. Cost per 
conversation stays near zero.

🎓 **Canvas LMS sync.** Connects to your university's Canvas account and 
turns upcoming assignments into Murphi tasks automatically.

📊 **Expense prediction & insights.** Forecasts next month's spending from 
your 3-month category history, tracks budgets, saving goals, study streaks, 
and Pomodoro sessions.

## Stack
- **Frontend:** React + Vite + Tailwind
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **AI:** Claude (tool use) — with Gemini/OpenAI as alternate providers
- **Auth:** Passport (Google & GitHub OAuth)
- **Integrations:** Canvas LMS API · node-cron for scheduled jobs

## Running locally
1. Clone the repo
2. `cd murphi-server && npm install` — copy `.env.example` to `.env` and 
   fill in your keys (MongoDB URI, Anthropic API key, OAuth credentials)
3. `npm run dev`
4. `cd ../murphi-client && npm install && npm run dev`
