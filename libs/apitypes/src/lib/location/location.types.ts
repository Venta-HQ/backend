import { z } from 'zod';
import { GenericLocationSyncDataSchema } from './location.schemas';

export type GenericLocationSyncData = z.infer<typeof GenericLocationSyncDataSchema>;
