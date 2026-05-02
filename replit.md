# Trustbit API

## Overview

Trustbit API is a branded multi-category API platform with 545+ endpoints across 19 categories (AI, Anime, Downloaders, Tools, TTS, and more). The platform includes a full-stack web app with landing page, interactive API docs, and a status dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (backend proxy)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: wouter
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/trustbit` — React/Vite frontend (landing page, docs, status) at `/`
- `artifacts/api-server` — Express API server at `/api`

## Key Backend Routes

- `GET /api/healthz` — Health check
- `GET /api/status` — Platform status (uptime, version, total endpoints)
- `GET /api/endpoints` — Full endpoint list grouped by category (deduped, NSFW excluded)
- `GET /api/categories` — Category summary list
- `GET /api/ai/*`, `/api/anime/*`, `/api/tts/*`, etc. — Transparent proxy routes

## Frontend Pages

- `/` — Landing page with hero, stats, code snippet, features
- `/docs` — Interactive API reference with category sidebar + search
- `/status` — Real-time platform status dashboard

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Notes

- The backend proxies all API requests to the upstream source and rewrites the `creator` field in all JSON responses to `"trustbit"`
- NSFW categories are excluded from all endpoint listings
- Category deduplication is handled server-side before serving to the frontend
