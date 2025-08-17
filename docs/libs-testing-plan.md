## Test Plan for `@libs`

### Goals
- Ensure high-signal, behavior-centric tests the team will actually use.
- Keep commits small, meaningful, and green between batches.
- Avoid brittle tests; focus on observable behavior, not internal internals.

### Scope and Priorities
1) nest/errors → filters → interceptors → guards → modules (networking, messaging, monitoring, core/data/external) → pipes (done) → eventtypes → apitypes/proto (skip or minimal).
2) Coverage target: ~80%+ on behavior-centric libs (skip generated code and pure types).

## Library-by-Library Plan

### @venta/nest/errors
Tests
- AppError factory methods: correct type/code/data; message from `ERROR_MESSAGES`.
- HTTP conversion: status codes map to ErrorType.
- gRPC conversion: `RpcException` fields `code/details/metadata` produced by encoder.
- WS conversion: structured payload shape.

### @venta/nest/filters
Files: `app-exception.filter.ts`, `grpc-exception.filter.ts`
Tests
- HTTP filter: `AppError` → structured body; unknown → 500 generic body.
- gRPC filter: `AppError` → `RpcException` with mapped code; unknown → internal.

### @venta/nest/interceptors
Request-ID (http/grpc/ws/nats)
- Sets/generates request IDs when missing; preserves when present.
- Adds to response headers/metadata/context.
Metrics
- Increments counters/histograms with expected labels on success/error.

### @venta/nest/guards
Auth (`auth.service.ts`, `http.guard.ts`, `grpc.guard.ts`, `ws.guard.ts`)
- Valid/invalid tokens; role/scope logic if present; context extraction.
Signed Webhook
- Signature match/mismatch, optional clock skew behavior.
Throttling (WsThrottlerGuard)
- Throws `WsException(AppError.rateLimit)`; metric increment; logs context.

### @venta/nest/modules
networking/grpc-instance
- Metadata injection (`x-user-id`, `x-request-id`, OTEL carrier).
- `retryObservable` path on Observable errors; success path completes; span end (spy tracer).
networking/request-context
- Set/get requestId and correlationId; isolation per request.
core/config/logger
- Config: schema validation for required env keys; defaults.
- Logger: structured output fields; context set/preserved; pretty vs structured (smoke).
data/prisma
- Module provides `PrismaService`; `onModuleInit` connects (mock client).
data/redis
- Module wiring uses `REDIS_URL` and options from config.
external (algolia/clerk/cloudinary/upload)
- Module/provider wiring; basic service methods call SDK (mock SDKs).
messaging (typed-event.service, nats-queue)
- Typed emit enforces subject/data; queue subscribe executes handler once per message; correlation id propagation.
monitoring (prometheus/tracing/health)
- Prometheus service registers metrics; increment paths; label assertions.
- Health controller returns ok/degraded given mocked checks.
- Tracing module registers providers (smoke test).
infra.module
- Smoke test module composition with DI.

### @venta/nest/pipes
SchemaValidatorPipe (DONE)
- Valid input passes through.
- Invalid input throws `AppError` with mapped details.

### @venta/eventtypes
`unified-event-registry.ts`
- ALL_EVENT_SCHEMAS keys present.
- `getEventsForDomain`/`getEventsForSubdomain` filter correctly.
- Type linkage (smoke): minimal compile-time checks in `.ts` test file.

### @venta/apitypes
- Pure types; skip runtime tests.

### @venta/proto
- Generated; skip. `ProtoPathUtil` already covered in utils.

## Test Approach and Tooling
- Runner: Vitest
- Nest tests: use `@nestjs/testing` when DI is needed; otherwise construct classes directly with fakes.
- Mocks/stubs
  - Logger (vi.fn)
  - PrometheusService (fake registry with `.getMetric().inc()`)
  - External SDKs: algolia/clerk/cloudinary (vi.fn)
  - Redis, NATS (fakes)
  - OpenTelemetry tracer/span (spy `trace.getTracer`)
  - gRPC Metadata from `@grpc/grpc-js`

## Batching and Commit Plan
Batch 1 (highest signal)
- Filters + request-id interceptors + grpc-instance.

Batch 2
- Guards (auth + signed-webhook) + messaging (typed-event, nats-queue).

Batch 3
- Monitoring (prometheus/health) + logger.

Batch 4
- External modules (SDK mocks) + data (prisma/redis) + infra smoke.

Batch 5
- Eventtypes registry.

Each batch
- Add tests, run locally, ensure green, commit with meaningful message.

## Quality Gates
- Skip generated code.
- Avoid brittle timing-based assertions unless using fake timers.
- Prefer asserting observable side-effects (headers, metadata, counters, payloads).


