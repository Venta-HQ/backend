import { algoliasearch, BatchResponse, SearchClient, UpdatedAtWithObjectIdResponse } from 'algoliasearch';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';

// Define proper types for Algolia operations
export interface AlgoliaObject
	extends Record<string, string | number | boolean | Date | null | undefined | object | any[]> {
	objectID: string;
}

export interface AlgoliaUpdateAttributes
	extends Record<string, string | number | boolean | Date | null | undefined | object | any[]> {
	objectID: string;
}

@Injectable()
export class AlgoliaService {
	private client: SearchClient;
	private readonly logger = new Logger(AlgoliaService.name);

	constructor(applicationId: string, apiKey: string) {
		if (!applicationId || !apiKey) {
			throw AppError.internal('ALGOLIA_SERVICE_ERROR', ErrorCodes.ALGOLIA_SERVICE_ERROR, {
				operation: 'initialize_client',
				message: 'Missing Algolia credentials',
			});
		}

		try {
			this.client = algoliasearch(applicationId, apiKey);
		} catch (error) {
			throw AppError.internal('ALGOLIA_SERVICE_ERROR', ErrorCodes.ALGOLIA_SERVICE_ERROR, {
				operation: 'initialize_client',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	async createObject(indexName: string, body: AlgoliaObject): Promise<UpdatedAtWithObjectIdResponse> {
		if (!indexName || !body?.objectID) {
			throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				operation: 'create_object',
				indexName,
				objectID: body?.objectID,
				message: 'Missing required fields',
			});
		}

		try {
			return await this.client.saveObject({
				body,
				indexName,
			});
		} catch (error) {
			throw AppError.externalService('ALGOLIA_SERVICE_ERROR', ErrorCodes.ALGOLIA_SERVICE_ERROR, {
				operation: 'create_object',
				indexName,
				objectID: body.objectID,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	async updateObject(
		indexName: string,
		entityId: string,
		attributesToUpdate: AlgoliaUpdateAttributes,
	): Promise<UpdatedAtWithObjectIdResponse | null> {
		if (!indexName || !entityId || !attributesToUpdate) {
			throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				operation: 'update_object',
				indexName,
				entityId,
				message: 'Missing required fields',
			});
		}

		try {
			const { hits } = await this.client.searchSingleIndex({
				indexName,
				searchParams: {
					query: entityId,
					restrictSearchableAttributes: ['id'],
				},
			});

			if (!hits.length) {
				this.logger.warn('Attempted to update an algolia record that did not exist', {
					entityId,
					indexName,
					searchParams: {
						query: entityId,
						restrictSearchableAttributes: ['id'],
					},
				});
				return null;
			}

			// Convert attributes to Algolia-compatible format
			const algoliaAttributes: Record<string, string> = {};
			for (const [key, value] of Object.entries(attributesToUpdate)) {
				if (value !== null && value !== undefined) {
					// Convert non-string values to strings for Algolia
					algoliaAttributes[key] = typeof value === 'string' ? value : String(value);
				}
			}

			return await this.client.partialUpdateObject({
				attributesToUpdate: algoliaAttributes,
				createIfNotExists: false,
				indexName,
				objectID: hits[0].objectID,
			});
		} catch (error) {
			throw AppError.externalService('ALGOLIA_SERVICE_ERROR', ErrorCodes.ALGOLIA_SERVICE_ERROR, {
				operation: 'update_object',
				indexName,
				entityId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	async deleteObject(indexName: string, entityId: string): Promise<BatchResponse[]> {
		if (!indexName || !entityId) {
			throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				operation: 'delete_object',
				indexName,
				entityId,
				message: 'Missing required fields',
			});
		}

		try {
			const { hits } = await this.client.searchSingleIndex({
				indexName,
				searchParams: {
					query: entityId,
					restrictSearchableAttributes: ['id'],
				},
			});

			if (!hits.length) {
				this.logger.warn('Attempted to delete an algolia record that did not exist', {
					entityId,
					indexName,
					searchParams: {
						query: entityId,
						restrictSearchableAttributes: ['id'],
					},
				});
				return [];
			}

			return await this.client.deleteObjects({
				indexName,
				objectIDs: hits.map((hit) => hit.objectID),
			});
		} catch (error) {
			throw AppError.externalService('ALGOLIA_SERVICE_ERROR', ErrorCodes.ALGOLIA_SERVICE_ERROR, {
				operation: 'delete_object',
				indexName,
				entityId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
