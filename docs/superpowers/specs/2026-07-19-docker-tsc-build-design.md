# Docker tsc Build Rollback

## Goal

Restore the Bridge Docker image to the existing TypeScript compiler build path so runtime files retain the directory layout expected by `__dirname`-based paths.

## Scope

- Change the Bridge build step in the root `Dockerfile` from `pnpm build` to `pnpm compile`.
- Keep `build.mjs`, the `build` package script, and the esbuild dependency unchanged.
- Do not change Bridge runtime code, client code, image naming, or Docker Compose configuration.

## Expected behavior

The Docker build uses `tsc`, copies static assets and workspace packages through the existing `compile` script, and produces an image where:

- `/ping` returns HTTP 200.
- `/file-manager/` returns the bundled file manager instead of HTTP 404.
- a websocket-only Socket.IO client connects and receives `requireAuth`.

## Verification

Build the image from the repository root, start it with the checked-in Bridge configuration, test the two HTTP endpoints and Socket.IO handshake, then remove the temporary container.
