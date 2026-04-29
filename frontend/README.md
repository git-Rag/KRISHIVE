## KRISHIVE Frontend

Production-oriented Next.js frontend for multilingual voice-first agriculture assistance.

## Local setup

### 1) Backend

Configure `backend/.env` from `backend/.env.example`, then run:

```powershell
uvicorn main:app --reload --port 8000
```

### 2) Frontend

Create `frontend/.env.local` from `frontend/.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Install and start:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```powershell
npm run lint
npm run build
```

## Production notes

- Security response headers are configured in `next.config.ts`.
- PWA generation is enabled for non-development environments.
- Backend URL is environment-driven through `NEXT_PUBLIC_API_URL`.
