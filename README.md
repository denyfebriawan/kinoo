# Kinoo

Watch YouTube videos together, in sync, with live chat. Create a room, share the link, paste a video, and everyone's playback stays locked together.

## Features

- Create a room and get a shareable link or 6-character code
- Load any YouTube link and it opens for everyone in the room
- Play, pause and seek are synced live for all viewers
- Late joiners start at the right position in the video
- Drift correction: viewers who slowly slip out of sync are pulled back
- Presence list of who is in the room
- Live chat: rate-limited, ephemeral, and rendered as plain text

No accounts and no database. You only type a display name.

## How it works

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, YouTube IFrame Player API
- **Real-time server:** Node.js and Socket.io, with all state (rooms, playback, chat) held in memory

**The server is the source of truth for playback.** A client never moves its own player directly. It sends `play`, `pause` or `seek`, and the server's broadcast is what moves every player, including the sender's. The server sends the position as of the moment it sends, and each client extrapolates from when it received it, so no clock synchronisation is needed.

**Drift correction.** Each player reports its position every ~3 seconds. If it is more than 1.5 seconds away from where the server expects it to be, the server sends a correction to that client only.

**Chat** keeps the last 50 messages per room in memory, is throttled to one message per 1.5 seconds per connection, and never persists anywhere. Message text is rendered as plain React text, so there is no HTML injection.

**Single server instance.** In-memory room state only works with one process. Scaling horizontally would mean moving shared state to Redis.

## Running locally

Requires Node 20 or newer. Each folder is its own npm package.

```bash
# terminal 1: Socket.io server on http://localhost:4000
cd server
npm install
npm run dev

# terminal 2: web app on http://localhost:3000
cd web
npm install
npm run dev
```

Open <http://localhost:3000> in two browser tabs to try it. The app expects the server at `http://localhost:4000`; set `NEXT_PUBLIC_SOCKET_URL` to change that.

Useful checks:

```bash
cd server && npx tsc --noEmit
cd web && npx next typegen && npx tsc --noEmit && npm run lint
```

## Deployment

The frontend runs on Vercel and the Socket.io server on a VM behind Nginx with HTTPS. See [deploy/README.md](deploy/README.md) for the full steps.

## Roadmap

- Reaction-cam: client-side facial-emotion detection that triggers emoji reactions. Camera frames will never leave the browser.
- Chat toxicity moderation with a fine-tuned DistilBERT model
- Manual emoji reactions
- Video queue and playlists
