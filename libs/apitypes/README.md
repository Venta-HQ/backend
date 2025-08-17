## @venta/apitypes

Lightweight, framework-agnostic API types shared across apps. Provides common request/response shapes and transport-specific type helpers for HTTP, WebSocket, and gRPC layers.

What it’s for:

- Standardize API request/response data shapes
- Share common HTTP/WS/gRPC type aliases
- Keep transport concerns decoupled from domain logic

Guidelines:

- Keep it minimal and stable; avoid domain-specific types
- Prefer pure TypeScript interfaces and type aliases
- Validation schemas live in `@venta/utils` to be reused across transports

Typical usage:

- Import `HttpRequest`, `WsContext`, and gRPC helper types where needed
- Compose your own app-level types from these base building blocks
