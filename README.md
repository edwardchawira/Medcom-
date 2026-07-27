# Medcom

Medcom is a Next.js e-learning platform for UK health and social care training. It includes static course experiences, authenticated learner progress, community-created courses, and an AI-assisted course builder backed by Supabase.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth, database, and storage
- AI SDK with OpenAI for course-outline and block generation

## Main Areas

- `/` dashboard
- `/courses` course catalogue
- `/collections` course collections
- `/my-learning` learner progress
- `/portfolio` learner portfolio
- `/courses/upload` course upload or AI course builder, depending on feature flag
- `/api/community-courses/*` community course, block, and AI generation APIs

## Environment

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_AI_COURSE_BUILDER=true
```

`OPENAI_API_KEY` is required for production AI generation. In development, the AI services can fall back to local placeholder output so the builder remains usable without a key.

For maintenance scripts only:

```bash
SUPABASE_SERVICE_ROLE_KEY=
```

Never commit real `.env*`, service-role keys, or local desktop connector configs.

## Development

```bash
npm install
npm run dev
```

The default dev command starts Next on port `3000` after clearing that port. Use `npm run dev:3001` if you need a second port.

## Verification

```bash
npm run lint
npm run build
npm audit --omit=dev
```

## Database

The AI course-builder additions live in:

```bash
supabase/migrations/20260429_ai_course_builder.sql
```

Apply migrations through your Supabase workflow before using community course blocks or block reordering.

## Course Builder Safety

Generated community courses are saved as drafts by default. Public publishing should happen only after human review of lesson content, quiz answers, explanations, and healthcare-specific guidance.
