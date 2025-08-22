### Contracts folder conventions

This document defines how each domain's `contracts/` folder is organized and what belongs where. It serves as the single source of truth for structure, naming, ownership, and import patterns after the DDD migration.

#### Scope and intent

- Contracts are the domain boundary: shared, injectable building blocks and pure mapping utilities used by all apps inside the same domain.
- Contracts are transport-agnostic and domain-centric.
- Implementations live in apps, not in `contracts/`.

#### Canonical layout (per domain)

```
domains/<domain>/contracts/
├── anti-corruption-layers/
│   └── <service>.acl.ts                  # e.g., clerk.acl.ts, revenuecat.acl.ts, cloudinary.acl.ts
├── context-mappers/
│   └── <source>-to-<target>.context-mapper.ts
├── schemas/
│   └── <topic>.schemas.ts                # zod schemas for runtime validation
├── types/
│   ├── context-mapping.types.ts          # type-only DTOs for mapping
│   ├── domain-contracts.types.ts         # optional: service interfaces
│   └── index.ts                          # exports types; may re-export from ../schemas when convenient
├── utils/
│   └── <helpers>.ts
├── <domain>-contracts.module.ts          # Nest module exposing shared providers (ACLs only)
├── index.ts                              # public entrypoint (module + ACLs + mapper re-exports)
└── README.md                             # optional; use this central doc instead
```

#### File responsibilities

- Contracts module (`<domain>-contracts.module.ts`)

  - Provides and exports ACL classes only.
  - Example: `ClerkAntiCorruptionLayer`, `RevenueCatAntiCorruptionLayer`, `CloudinaryACL`.
  - Do not register function mappers as providers.

- Index (`contracts/index.ts`)

  - Re-exports the contracts module.
  - Re-exports ACL classes.
  - Re-exports mapper files as namespaces (mappers are functions):
    ```ts
    export * as MarketplaceToLocationContextMapper from './context-mappers/marketplace-to-location.context-mapper';
    ```
  - Optionally re-export `types` barrel.

- Context mappers (`context-mappers/*.context-mapper.ts`)

  - Pure functions that translate outbound data from this domain to another domain’s shape.
  - Transport-agnostic.
  - Owned by the source domain only (outbound direction).
  - Naming: `<Source>To<Target>ContextMapper` in code; file name `source-to-target.context-mapper.ts`.

- Anti-Corruption Layers (ACLs) (`anti-corruption-layers/*.acl.ts`)

  - Injectable classes that isolate the domain from external services and protocols (Clerk, RevenueCat, Algolia, HTTP/gRPC/WebSocket/NATS, etc.).
  - Encapsulate validation, error translation, retries, and client quirks.
  - Naming: `XxxACL` class; file name `xxx.acl.ts`.

- Schemas (`schemas/*.schemas.ts`)

  - Runtime validation (e.g., zod) for inputs/outputs.
  - Keep schema files out of `types/` to maintain a clean separation between runtime and type-only artifacts.

- Types (`types/*`)

  - Type-only DTOs and optional service interfaces.
  - `types/index.ts` may re-export schemas from `../schemas/*` for convenience, but new code should prefer importing schemas directly from `schemas/`.

- Utils (`utils/*`)
  - Small helpers used by mappers/ACLs. Keep them boundary-focused.

#### Ownership and directionality

- Each domain owns only its outbound mappers.
- No inbound mappers in `contracts/`. Inbound translation belongs in the receiving app/module.
- Implementations do not live in `contracts/`; they live inside domain apps that consume contracts.

#### Naming conventions

- ACL files: `xxx.acl.ts`; class name: `XxxACL`.
- Mapper files: `xxx.context-mapper.ts`; exported as pure functions.
- Schema files: `*.schemas.ts` under `contracts/schemas/`.

#### Import patterns

- ACLs (injectable):

  ```ts
  import { ClerkAntiCorruptionLayer } from '@venta/domains/marketplace/contracts/anti-corruption-layers/clerk.acl';

  @Injectable()
  export class MyService {
  	constructor(private readonly clerkACL: ClerkAntiCorruptionLayer) {}
  }
  ```

- Mappers (functions; not providers):

  ```ts
  import * as MarketplaceToLocation from '@venta/domains/marketplace/contracts/context-mappers/marketplace-to-location.context-mapper';

  const dto = MarketplaceToLocation.toLocationVendorLocation(input);
  ```

- Schemas:

  ```ts
  import { CreateVendorSchema } from '@venta/domains/infrastructure/contracts/schemas/vendor/vendor.schemas';
  ```

- Public entrypoint:

  ```ts
  import {
  	ClerkAntiCorruptionLayer,
  	MarketplaceContractsModule,
  	MarketplaceToLocationContextMapper,
  } from '@venta/domains/marketplace/contracts';

  // namespace re-export
  ```

#### Do and Don’t

- Do

  - Export ACLs as providers via the contracts module.
  - Re-export mappers as namespaces from `contracts/index.ts`.
  - Keep schemas under `contracts/schemas/` and types under `contracts/types/`.
  - Keep mappers transport-agnostic and focused on data translation.

- Don’t
  - Don’t place inbound mappers in `contracts/` (put them in the receiving app).
  - Don’t place implementations (service logic) in `contracts/`.
  - Don’t register mappers as Nest providers.

#### Optional metrics

- If the domain needs metrics, import `PrometheusModule.register()` in the contracts module. Be consistent across domains.

#### PR checklist (validation)

- [ ] No `contracts/implementations/` directories.
- [ ] No inbound mappers under `contracts/`.
- [ ] All ACLs named `*.acl.ts`; all mappers named `*.context-mapper.ts`.
- [ ] All schemas live in `contracts/schemas/` (none under `types/`).
- [ ] Contracts module exports all ACL providers; no mapper providers registered.
- [ ] `contracts/index.ts` re-exports: module, ACLs, and mapper namespaces.
- [ ] Import examples in apps match the patterns above.

### Types vs Schemas: separation and patterns

The separation between runtime schemas and compile-time types is strict:

- Schemas live only under `contracts/schemas/` and contain zod validators (runtime code).
- Types live only under `contracts/types/` and contain TypeScript types/interfaces (no zod definitions).
- Types may infer from schemas using `z.infer<typeof ...>` but must import schemas from `../schemas/*`.

Recommended file conventions:

- `contracts/schemas/<topic>.schemas.ts`: zod validators for a cohesive topic (e.g., `user.schemas.ts`, `vendor.schemas.ts`).
- `contracts/types/<topic>.types.ts`: type aliases and interfaces that represent domain concepts and map to schemas when needed.
- `contracts/types/context-mapping.types.ts`: DTOs used by context mappers.
- `contracts/types/domain-contracts.types.ts` (optional): service interfaces for domain contracts.
- `contracts/types/index.ts`: barrel exporting types; optionally re-export specific schemas for convenience.

Example schema file (runtime):

```ts
// contracts/schemas/user/user.schemas.ts
import { z } from 'zod';

export const GrpcUserIdentitySchema = z.object({ id: z.string() });
export const ClerkUserSchema = z.object({
	id: z.string(),
	email_addresses: z.array(z.object({ email_address: z.string().email() })),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	created_at: z.string(),
	updated_at: z.string(),
});

export type GrpcUserIdentity = z.infer<typeof GrpcUserIdentitySchema>;
export type ClerkUser = z.infer<typeof ClerkUserSchema>;
```

Example types file (compile-time only):

```ts
// contracts/types/user/user.types.ts
import type { z } from 'zod';
import {
	ClerkUserSchema as BaseClerkUserSchema,
	GrpcUserIdentitySchema as BaseGrpcUserIdentitySchema,
} from '../../schemas/user/user.schemas';

export type GrpcUserIdentity = z.infer<typeof BaseGrpcUserIdentitySchema>;
export interface UserProfile {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
}

### 📚 Related docs

- [Architecture Guide](./architecture-guide.md)
- [Developer Guide](./developer-guide.md)
- [Domain Contracts & Context Mapping](./domain-contracts-guide.md)
- [API Documentation](./api-docs.md)
export namespace Contracts {
	export type ExternalClerkUser = z.infer<typeof BaseClerkUserSchema>;
}
```

Barrel re-export pattern:

```ts
// contracts/types/index.ts
export * from './context-mapping.types';
export * from './user/user.types';
// Re-export select schemas for convenience when callers expect a single import surface
export { GrpcUserIdentitySchema, ClerkUserSchema } from '../schemas/user/user.schemas';
```

### Namespace taxonomy for types

When using namespaces in `contracts/types/*`, follow this taxonomy:

- `Core`: domain-centric types (entities/value objects as used by the domain itself).
- `Contracts`: DTOs that cross the domain boundary (inputs/outputs for other domains or external services).
- `Internal`: private, non-exported infrastructure-facing types (e.g., persistence shapes, cached structures). Prefer keeping these out of the public barrel.

Notes:

- Validation artifacts (zod schemas) belong in `schemas/`, not under a `Validation` namespace in types. If you wish to expose validators via a namespaced API, re-export them from `types/index.ts` but keep the code in `schemas/`.
- Context-mapping DTOs should live in `context-mapping.types.ts` and be imported by mappers. They can reference `Core` or `Contracts` shapes as needed.

### Context mapping types (context-mapping.types.ts)

Use a consistent structure in every domain’s `context-mapping.types.ts`:

- Top-level domain namespace only (e.g., `Marketplace`, `Infrastructure`, `Communication`, `LocationServices`).
- Inside it, define sub-namespaces:
  - Core: domain-centric entities/value objects
  - Contracts: DTOs that cross the domain boundary
  - Internal: private shapes for internal use
  - Events (optional): event payload types
- No Validation namespace here; schemas live in `contracts/schemas/**`.
- No zod imports in this file.
- Cross-domain references use namespace aliasing instead of treating sub-namespaces as values.

Example (Location Services):

```ts
import { Location as LocationTypes } from './location/location.types';
import { RealTime as RealTimeTypes } from './realtime/realtime.types';

export namespace LocationServices {
	export import RealTime = RealTimeTypes;
	export import Location = LocationTypes;
}
```

Example (Marketplace referencing Location Services):

```ts
import { LocationServices } from '@domains/location-services/contracts/types/context-mapping.types';

export namespace Marketplace {
	export namespace Core {
		export interface VendorLocationUpdate {
			vendorId: string;
			location: LocationServices.Location.Core.Coordinates;
			timestamp: string;
		}
	}
}
```
