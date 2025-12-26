# SAHAS GRINDSET 🏋️‍♂️

**Sahas Grindset** is a gamified, AI-powered fitness tracking application designed to keep users consistent with their daily workouts. It bridges the gap between a personal trainer and a habit tracker using Generative AI.

## 🚀 Features

### For Users (The Grind)
- **Daily Workouts:** Users receive a daily checklist of exercises.
- **Gamification:** Earn points for every exercise and build "Streaks" for daily consistency.
- **AI Coach:** Click the `?` button next to any exercise, and the AI (Llama 3) explains how to do it and provides a YouTube search link.
- **Leaderboard:** Compete with others to see who has the highest streak.
- **Authentication:** Secure login and profile management via Supabase.

### For Admins (The Command Center)
- **AI Workout Generation:** The Admin types a goal (e.g., "Leg destruction"), and the AI generates a structured JSON workout plan.
- **One-Click Publishing:** Push the workout to all users instantly via the cloud database.
- **Announcements:** Post rest-day messages or updates directly to the user dashboard.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL)
- **AI Model:** Llama 3.3-70B via Groq Cloud API
- **Deployment:** Vercel
