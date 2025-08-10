import { ArgumentMetadata, Injectable, Logger, PipeTransform } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { LocationUpdateSchema, SearchRecordSchema, SearchUpdateSchema } from '../../schemas/search/search.schemas';
import type {
	AlgoliaIndexConfig,
	IndexConfig,
	LocationUpdate,
	SearchError,
	SearchRecord,
	SearchUpdate,
} from '../../types/internal';

// ============================================================================
// EXTERNAL ALGOLIA ACL PIPES - Transform Algolia API types to domain types
// ============================================================================

/**
 * Algolia Search Record ACL Pipe
 * Validates and transforms search record data
 */
@Injectable()
export class AlgoliaSearchRecordACLPipe implements PipeTransform<unknown, SearchRecord> {
	private validator = new SchemaValidatorPipe(SearchRecordSchema);

	transform(value: unknown, metadata: ArgumentMetadata): SearchRecord {
		return this.validator.transform(value, metadata);
	}
}

/**
 * Algolia Search Update ACL Pipe
 * Validates and transforms search update data
 */
@Injectable()
export class AlgoliaSearchUpdateACLPipe implements PipeTransform<unknown, SearchUpdate> {
	private validator = new SchemaValidatorPipe(SearchUpdateSchema);

	transform(value: unknown, metadata: ArgumentMetadata): SearchUpdate {
		return this.validator.transform(value, metadata);
	}
}

/**
 * Algolia Location Update ACL Pipe
 * Validates and transforms location update data
 */
@Injectable()
export class AlgoliaLocationUpdateACLPipe implements PipeTransform<unknown, LocationUpdate> {
	private validator = new SchemaValidatorPipe(LocationUpdateSchema);

	transform(value: unknown, metadata: ArgumentMetadata): LocationUpdate {
		return this.validator.transform(value, metadata);
	}
}
