import { z } from 'zod';
import type { EnforceValidDomainEvents } from '@venta/eventtypes';

// Communication domain events with type enforcement
export const communicationEventSchemas = {} as const satisfies EnforceValidDomainEvents<'communication'>;

// Type-safe event data map
export type CommunicationEventDataMap = {
	[K in keyof typeof communicationEventSchemas]: z.infer<(typeof communicationEventSchemas)[K]>;
};
