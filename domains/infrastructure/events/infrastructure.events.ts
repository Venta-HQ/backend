import { z } from 'zod';
import { createEventSchema, EnforceValidDomainEvents } from '@venta/eventtypes';

// Infrastructure domain events with type enforcement
export const infrastructureEventSchemas = {} as const satisfies EnforceValidDomainEvents<'infrastructure'>;

// Type-safe event data map
export type InfrastructureEventDataMap = {
	[K in keyof typeof infrastructureEventSchemas]: z.infer<(typeof infrastructureEventSchemas)[K]>;
};
