# Docker tsc Build Rollback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Bridge Docker image to the existing tsc build path without changing non-Docker build commands.

**Architecture:** The root Dockerfile will call the existing `pnpm compile` script instead of the esbuild-backed `pnpm build` script, then restore the generated `@icalingua` workspace packages after production dependency installation. Runtime behavior will be verified from a freshly built image through HTTP and Socket.IO entry points.

**Tech Stack:** Docker, pnpm, TypeScript compiler, Express, Socket.IO

## Global Constraints

- Only the Docker build path changes from esbuild to tsc, including restoration of the tsc build's generated workspace packages.
- Keep `icalingua-bridge-oicq/build.mjs`, the `build` package script, and the esbuild dependency unchanged.
- Do not change Bridge runtime code, client code, image naming, or Docker Compose configuration.

---

### Task 1: Restore and verify the Docker tsc build

**Files:**
- Modify: `Dockerfile:13-16`
- Test: one-off repository checks and a temporary Docker container

**Interfaces:**
- Consumes: `icalingua-bridge-oicq/package.json` script `compile`
- Produces: a Docker image whose `/app/build` tree preserves tsc module directories and copied static assets

- [ ] **Step 1: Run the failing build-command check**

Run:

```bash
rg -n 'pnpm compile' Dockerfile
```

Expected: exit 1 because Docker currently invokes `pnpm build`.

- [ ] **Step 2: Make the minimal Dockerfile change**

Restore the tsc build command and its workspace package relocation:

```dockerfile
pnpm compile && \
mv /app/icalingua-bridge-oicq/build /tmp/build && \
cd /tmp/build && npm i && \
mv /tmp/build/@icalingua /tmp/build/node_modules/
```

- [ ] **Step 3: Run the build-command check again**

Run:

```bash
rg -n 'pnpm compile' Dockerfile
```

Expected: exit 0 and output containing line 13.

- [ ] **Step 4: Build a fresh Docker image**

Run:

```bash
docker build -t icalingua-bridge-oicq-tsc-test .
```

Expected: exit 0 after `pnpm compile`, workspace package copying, and production dependency installation complete.

- [ ] **Step 5: Start a temporary Bridge container**

Run:

```bash
docker run --rm -d --name icalingua-bridge-tsc-test -p 127.0.0.1:16789:6789 -v "$PWD/icalingua-bridge-oicq/config.yaml:/app/config.yaml:ro" icalingua-bridge-oicq-tsc-test node build
```

Expected: a container ID and a Bridge listener on port 16789.

- [ ] **Step 6: Verify HTTP and Socket.IO behavior**

Run:

```bash
curl -fsS http://127.0.0.1:16789/ping
curl -fsS http://127.0.0.1:16789/file-manager/ >/dev/null
node -e "const {io}=require('socket.io-client');const s=io('http://127.0.0.1:16789',{transports:['websocket'],timeout:3000,reconnection:false});s.on('requireAuth',(salt,v)=>{console.log(v);s.close()});s.on('connect_error',e=>{console.error(e);process.exitCode=1});setTimeout(()=>s.close(),5000)"
```

Expected: `/ping` returns JSON, `/file-manager/` returns HTTP 200, and Socket.IO prints Bridge version `2.26.0`.

- [ ] **Step 7: Remove the temporary container and review the patch**

Run:

```bash
docker stop icalingua-bridge-tsc-test
git diff --check
git diff -- Dockerfile docs/superpowers/plans/2026-07-19-docker-tsc-build.md
```

Expected: the temporary container is removed, `git diff --check` exits 0, and the only production changes are the tsc invocation and restoration of generated workspace packages.

- [ ] **Step 8: Commit the implementation**

Run:

```bash
git add Dockerfile docs/superpowers/plans/2026-07-19-docker-tsc-build.md
git commit -m "fix(docker): restore tsc bridge build"
```

Expected: one commit containing the Dockerfile rollback and its implementation plan.
