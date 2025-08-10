import { z } from 'zod';
import { EnforceValidDomainEvents } from '../../shared';

// Infrastructure domain events with type enforcement
export const infrastructureEventSchemas = {} as const satisfies EnforceValidDomainEvents<'infrastructure'>;

// Type-safe event data map
export type InfrastructureEventDataMap = {
	[K in keyof typeof infrastructureEventSchemas]: z.infer<(typeof infrastructureEventSchemas)[K]>;
};
