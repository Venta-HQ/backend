## Production-ready avatar/profile image uploads

### Purpose

This document outlines recommendations and a practical game plan to harden the current image upload flow (avatars/profile images) for production use. It covers security, performance, reliability, observability, and maintainability.

### Current architecture (as of this doc)

- HTTP Gateway route: `POST /upload/image` in `domains/infrastructure/apps/api-gateway/src/upload/upload.controller.ts`.
  - Uses `Multer` in-memory buffer, 5MB limit, strict single-part constraints.
  - Guarded by `HttpAuthGuard`; validates query (unused yet) and file type; adds a basic magic‑byte check.
  - Calls `@file-management` gRPC `UploadImage` with `FileUploadACL`.
- File Management service (gRPC): `domains/infrastructure/apps/file-management`
  - gRPC controller: `core/controllers/file-management/file-management.controller.ts` → `FileManagementService` → Cloudinary.
  - gRPC message size limits raised to 6MB on both client and server (`libs/nest/modules/networking/grpc-instance/grpc-instance.module.ts`, `libs/nest/modules/core/bootstrap/bootstrap.service.ts`).
- Observability: request-id and trace metadata propagated in gRPC (`GrpcInstance`).

### Goals

- Ensure uploads are safe (no content-based attacks), predictable (fixed format/size), and cost-efficient.
- Keep UX fast; minimize gateway CPU and memory.
- Provide auditability and cleanup on avatar change.

### Key risks to mitigate

- Spoofed MIME types and SVG/XSS vectors.
- Decompression bombs / enormous dimensions.
- EXIF/GPS data leakage.
- Unbounded formats, inconsistent transformations.
- Orphaned storage on avatar replacement.

### Recommendations

- Security

  - Allowlist formats: jpeg, png, webp. Block svg.
  - Verify magic bytes (basic check added) and also probe image header to confirm dimensions and type.
  - Enforce dimension/pixel cap (e.g., max 4096x4096 or 12MP).
  - Strip metadata (EXIF/GPS). Use Cloudinary transforms or preset to remove metadata.
  - Ignore client filenames; use server-generated `public_id` and fixed folder (e.g., `avatars/`).
  - Enforce auth both at gateway and on gRPC (trust metadata `x-user-id`), rejecting anonymous requests server-side.
  - Keep strict Multer limits: `{ files: 1, fields: 0, parts: 1 }`, size 5MB (or lower per product).

- Performance & UX

  - Apply a Cloudinary avatar preset: `512x512`, `crop: fill`, `gravity: face`, `q_auto`, `f_auto`.
  - Consider client→Cloudinary direct signed uploads for avatars (best latency and offloads gateway). Gateway issues signed params; store result via callback or client confirm.
  - Add gRPC deadlines/timeouts on the client call.
  - CDN caching: serve avatars via CDN with immutable URLs (public IDs), set caching headers.

- Reliability & lifecycle

  - On avatar replacement, delete previous `public_id` and invalidate CDN when applicable.
  - Persist the `public_id` in the user domain, link to ownership; enforce that only owners can replace/delete.
  - Keep retries in gRPC client (already present) and map errors consistently.

- Observability & policy

  - Emit metrics: counts of accepted/rejected uploads by reason, durations, sizes, and user id.
  - Log sanitized context (filename, size, type), and request id. Avoid logging binary or secrets.
  - Document acceptable use (size, formats) in API docs.

- Maintainability
  - Centralize upload config (allowed types, max size, max dimensions) in env/config service shared by gateway and file-management to avoid drift.
  - Extend proto to carry optional upload options (folder, transformations) if needed; otherwise keep a fixed avatar path.

### Configuration

Add or confirm the following envs (examples):

```
# Gateway
UPLOAD_MAX_FILE_SIZE=5242880
UPLOAD_ALLOWED_MIME=image/jpeg,image/png,image/webp
UPLOAD_MAX_PIXELS=12000000           # 12MP

# File-management gRPC
FILE_MANAGEMENT_SERVICE_ADDRESS=0.0.0.0:5005
FILE_MANAGEMENT_HEALTH_PORT=3015

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_AVATAR_FOLDER=avatars
CLOUDINARY_AVATAR_PRESET=avatar_512_face_auto
```

### API surface changes (optional but recommended)

- Proto: add optional upload `options` (folder, preset) or standardize to a fixed avatar policy and keep proto minimal.
- Optionally include `bytes` and `format` in `FileUploadResponse` for parity with domain types.

### Implementation plan

Phase 1 – Hardening (now)

- Gateway
  - Add dimension probe and pixel-count cap before gRPC call.
  - Enforce MIME allowlist (jpeg/png/webp), block svg.
  - Config-gate max size and allowed MIME via `ConfigService`.
  - Add gRPC deadline on `UploadImage` (e.g., 10s) and surface 504 on timeout.
- File-management
  - Enforce auth by checking `x-user-id` metadata and reject if missing.
  - Use Cloudinary options to strip metadata and force `f_auto,q_auto`.
- Docs
  - Update API docs with size/format/dimension constraints.

Acceptance

- Unit/integration tests verify: bad type → 400; oversize → 413; oversized dimensions → 400; mismatched magic bytes → 400; success path returns url/publicId.

Phase 2 – Avatar policy & lifecycle

- Create a Cloudinary avatar preset (`512x512`, `crop=fill`, `gravity=face`, `f_auto,q_auto`), folder `avatars/`.
- Force preset/folder on all avatar uploads; ignore client naming.
- In user service, persist `public_id`. On update, delete previous cloud asset.

Acceptance

- Upload produces correctly transformed image; replacing avatar removes prior asset; database reflects new `public_id`.

Phase 3 – Optional direct signed uploads

- Gateway: endpoint to mint signed upload params (scoped to avatars, size/type/dim caps reflected in signature/preset).
- Client uploads directly to Cloudinary. Then client or a webhook notifies backend with resulting `public_id`.
- Backend validates ownership and records `public_id`; optional verification step via Cloudinary Admin API.

Acceptance

- Flow works without routing file through gateway; metrics reflect uploads; errors handled at client with clear messages.

Phase 4 – Policy and quotas

- Add per-user rate limit for uploads (e.g., 10/min) on gateway.
- Add storage lifecycle policy (e.g., auto-delete abandoned draft images if applicable).

### Testing strategy

- Unit tests: validation, magic‑byte detection, dimension probing, error mapping.
- Integration tests: gateway→gRPC path; Cloudinary mock.
- Load tests: concurrent small uploads to ensure memory stays bounded.
- Security tests: SVG and polyglot files rejected; huge dimensions rejected.

### Operational runbook

- Dashboards: upload rate, success/error counts, p95/99 latency, mean/95 size.
- Alerts: error-rate > X%, elevated 5xx, timeouts.
- Feature flags: roll out new preset and direct uploads behind flags.

### References

- Gateway controller: `domains/infrastructure/apps/api-gateway/src/upload/upload.controller.ts`
- File management controller: `domains/infrastructure/apps/file-management/src/core/controllers/file-management/file-management.controller.ts`
- gRPC instance config (client): `libs/nest/modules/networking/grpc-instance/grpc-instance.module.ts`
- gRPC bootstrap (server): `libs/nest/modules/core/bootstrap/bootstrap.service.ts`
