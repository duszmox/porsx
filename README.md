# CORS Proxy

A lightweight TypeScript HTTP proxy that forwards every request to `localhost:3000` (configurable) while stripping away CORS limitations. Useful for browser-based development when the upstream service does not expose permissive CORS headers.

## Prerequisites

- Node.js 18+

## Setup

```bash
npm install
# or
bun install
```

## Running

### Development

```bash
npm run dev
# or
bun run dev
```

Runs the TypeScript entrypoint directly via `ts-node`, ideal while iterating.

### Production / Compiled

```bash
npm run build
npm start
# or
bun run build
bun run start
```

This emits JavaScript into `dist/` and then runs the compiled server.

## Configuration

- `PORT`: Port for the proxy server (default `4000`).
- `TARGET`: Upstream origin to forward to (default `http://localhost:3000`).

Example:

```bash
PORT=8080 TARGET=https://localhost:3000 npm start
```

Now requests to `http://localhost:8080/api/...` will be proxied to `https://localhost:3000/api/...` with permissive CORS headers.
