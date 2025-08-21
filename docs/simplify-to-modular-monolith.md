## Simplify to a Modular Monolith

### Short answer

Simplify now. Keep the domain boundaries, collapse to one deployable, remove cross‑process plumbing and heavy infra. You’re not throwing away the good work; you’re removing drag. You can re‑add complexity later with low churn.

### Guiding principles

- **Keep contracts clean**: `domains/*/contracts` contain only contracts (no implementations).
- **Single deployable**: one Nest app (modular monolith) with clear feature modules.
- **No dormant code**: delete unused transports/infra/tests instead of leaving them disabled.
- **Tests**: only keep tests that assert real behavior.

### Target architecture

- **Host app**: `domains/infrastructure/apps/api-gateway` runs everything.
- **Feature modules** inside it: `upload`, `user`, `vendor`, `webhooks`, `location`, `search`.
- **In-process calls**: direct provider injection and method calls. No NATS, no gRPC.
- **Side effects** (e.g., Algolia): invoked directly in app services with basic retries.

---

## Implementation Plan

### Phase 0 — Pre‑flight

- Create branch: `simplify-monolith`.
- Ensure CI is green; snapshot current `.env` and `docker-compose.yml`.
- Confirm there’s no required external consumer of NATS or gRPC today.

### Phase 1 — Establish the single app

- In `domains/infrastructure/apps/api-gateway/src/`, create feature module folders:
  - `webhooks/`
  - `location/`
  - `marketplace/user/`
  - `marketplace/vendor/`
  - `marketplace/search/`
  - `upload/` (or `file/` if that’s clearer)
- Register these modules in `app.module.ts`.
- Keep shared code in `libs/*` and contracts in `domains/*/contracts`.

### Phase 2 — Move implementations into the monolith

- Communication/webhooks → `api-gateway/src/webhooks/**` (controllers/guards/services).
- Location services:
  - `geolocation` + `location-gateway` → `api-gateway/src/location/**` (merge providers; keep routes).
- Marketplace:
  - `user-management` → `api-gateway/src/marketplace/user/**`
  - `vendor-management` → `api-gateway/src/marketplace/vendor/**`
  - `search-discovery` (Algolia sync) → `api-gateway/src/marketplace/search/**`
- Infrastructure/file-management → `api-gateway/src/upload/**` (or `file/**`).
- Maintain TS path aliases where possible; adjust relative imports as needed.

### Phase 3 — Remove inter‑service transports

- Replace gRPC clients/servers with direct provider calls (same process).
- Delete gRPC bootstrap, clients, and related guards/interceptors.
- Replace NATS publish/subscribe with explicit service method calls.
  - Example: after a write, call `SearchSyncService.syncVendor(vendorId)` directly.

### Phase 4 — Pare down observability and infra

- Keep health checks and structured logs.
- Remove Prometheus/Grafana/Tempo from default local stack.
- Remove tracing/microservice interceptors tied to gRPC/NATS.

### Phase 5 — Config cleanup

- Collapse `.env` to only what the single app needs.
- Remove unused vars for NATS/gRPC/Tempo/Prometheus.
- Update `nest-cli.json` and TS configs for a single runnable app.

### Phase 6 — Delete unused code and assets (no dormancy)

- Remove entire app folders and Dockerfiles that are no longer used:
  - `domains/*/apps/*` except `infrastructure/apps/api-gateway`.
- Remove transport/infra code:
  - `libs/proto/*` (if only used by gRPC)
  - NATS queue modules and message wiring (if unused)
  - gRPC guards/interceptors/providers used only for microservices
- Docker:
  - Extra Dockerfiles in removed apps
  - Prometheus/Grafana/Tempo configs from default compose
- Tests:
  - Delete tests tied only to gRPC/NATS or placeholders.

### Phase 7 — Implement simple, reliable side effects

- Add a `SearchSyncService` in `api-gateway/src/marketplace/search/` exposing explicit methods, e.g., `syncVendor(vendorId: string)`.
- Invoke directly from the relevant application service after successful writes.
- Add lightweight retry/backoff (e.g., 2–3 retries) for external calls like Algolia.
- Log failures with enough context to re‑run manually if needed.

### Phase 8 — Test and validate

- Unit tests (Vitest): update or remove tests that depended on transports.
- Manual verification:
  - CRUD routes for user/vendor/upload/webhooks/location.
  - Algolia sync path works on create/update.
  - Health endpoint returns OK.
- Optional: run a basic load smoke (e.g., autocannon) to confirm no regression under modest load.

### Phase 9 — Docs and DX

- Update `docs/` and app `README.md` to reflect the single app architecture and simplified run commands.
- Local dev: `docker compose up db` + `npm run start:dev`.

### Phase 10 — Deploy

- Build one Docker image for the monolith.
- Simplify `docker-compose.yml` to app + Postgres (and Redis only if already used for caching/sessions).
- Roll out; monitor logs and error rates.

---

## Acceptance criteria

- One deployable service: `api-gateway` runs all features.
- No gRPC/NATS code or configs remain.
- Algolia indexing still happens on relevant writes.
- `domains/*/contracts` contain only contracts (no implementations).
- CI green; only useful tests remain.

## Suggested file moves (high level)

- `domains/communication/apps/webhooks/src/**` → `domains/infrastructure/apps/api-gateway/src/webhooks/**`
- `domains/location-services/apps/{geolocation,location-gateway}/src/**` → `.../src/location/**`
- `domains/marketplace/apps/{user-management,vendor-management}/src/**` → `.../src/marketplace/{user,vendor}/**`
- `domains/marketplace/apps/search-discovery/src/**` → `.../src/marketplace/search/**`
- `domains/infrastructure/apps/file-management/src/**` → `.../src/upload/**` (or `file/**`)

## Timeline

- Day 1: Establish modules, migrate `webhooks`, `upload`, and `marketplace/user|vendor`.
- Day 2: Migrate `location`, implement direct Algolia sync, delete unused apps/transports/infra, update docs, and validate.
