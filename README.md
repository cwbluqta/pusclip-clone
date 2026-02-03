This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Architecture (OpusClip-style)

**Goal:** keep Vercel only for UI/Frontend and move heavy video processing to a dedicated backend that can run `yt-dlp`/`ffmpeg`. The Next.js app calls the backend over HTTP and never runs `yt-dlp` locally.

### Backend downloader service (Railway/Render/Fly)

This repo ships a minimal backend in `backend/` with a single `/download` endpoint that runs `yt-dlp`.

**Key capabilities**

- Receives a YouTube URL
- Runs `yt-dlp` to download video or audio
- Returns a public URL for the generated file

**Environment variables (backend)**

```bash
PORT=8080
PUBLIC_BASE_URL=https://seu-backend.exemplo.com
DOWNLOADER_TOKEN=token-super-seguro
DOWNLOAD_DIR=/app/downloads
```

**Local run**

```bash
cd backend
npm install
npm run dev
```

**Deploy notes**

- Install `yt-dlp` and `ffmpeg` on the hosting provider (Railway/Render support build steps / apt packages).
- Make sure the runtime can write to `DOWNLOAD_DIR`.
- Configure `PUBLIC_BASE_URL` with the deployed hostname so `fileUrl` comes back fully qualified.

### Vercel (Frontend only)

The Next.js app exposes `/api/download` as a proxy to your backend. Configure these env vars in Vercel:

```bash
DOWNLOADER_URL=https://seu-backend.exemplo.com
DOWNLOADER_TOKEN=token-super-seguro
```

If your frontend is hosted elsewhere or needs a custom base URL, set:

```bash
VITE_API_BASE_URL=https://seu-frontend.exemplo.com
```

**Frontend usage (example)**

```ts
const response = await fetch("/api/download", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://www.youtube.com/watch?v=...", mode: "video" }),
});

const data = await response.json();
// data = { ok: true, fileUrl: "https://..." }
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
