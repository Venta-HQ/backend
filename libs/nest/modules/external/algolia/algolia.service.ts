import { algoliasearch } from 'algoliasearch';
import { Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';

// Define proper types for Algolia operations
export interface AlgoliaObject extends Record<string, unknown> {
	objectID: string;
	id: string;
}

export type AlgoliaUpdateAttributes = Partial<AlgoliaObject>;

@Injectable()
export class AlgoliaService {
	private client: ReturnType<typeof algoliasearch>;
	private readonly logger = new Logger(AlgoliaService.name);

	constructor(applicationId: string, apiKey: string) {
		if (!applicationId || !apiKey) {
			throw AppError.internal(ErrorCodes.ERR_EXTERNAL_SERVICE, {
				service: 'algolia',
				operation: 'initialize_client',
				message: 'Missing Algolia credentials',
			});
		}

		try {
			this.client = algoliasearch(applicationId, apiKey);
		} catch (error) {
			throw AppError.internal(ErrorCodes.ERR_EXTERNAL_SERVICE, {
				service: 'algolia',
				operation: 'initialize_client',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	async createObject(indexName: string, body: AlgoliaObject): Promise<AlgoliaObject> {
		if (!indexName || !body?.objectID) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				operation: 'create_object',
				indexName,
				objectID: body?.objectID,
				message: 'Missing required fields',
			});
		}

		try {
			const result = await this.client.addOrUpdateObject({
				indexName,
				objectID: body.objectID,
				body,
			});
			return { ...body, objectID: result.objectID };
		} catch (error) {
			throw AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE, {
				service: 'algolia',
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
	): Promise<AlgoliaObject | null> {
		if (!indexName || !entityId || !attributesToUpdate) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				operation: 'update_object',
				indexName,
				entityId,
				message: 'Missing required fields',
			});
		}

		try {
			const { results } = await this.client.searchSingleIndex({
				indexName,
				searchParams: {
					filters: `id:${entityId}`,
				},
			});

			const hits = results[0]?.hits;

			if (!hits?.length) {
				this.logger.warn('Attempted to update an algolia record that did not exist', {
					entityId,
					indexName,
					searchParams: {
						filters: `id:${entityId}`,
					},
				});
				return null;
			}

			const existingObject = hits[0];
			const result = await this.client.partialUpdateObject({
				indexName,
				objectID: existingObject.objectID,
				attributesToUpdate,
				createIfNotExists: false,
			});

			return { ...existingObject, ...attributesToUpdate, objectID: result.objectID };
		} catch (error) {
			throw AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE, {
				service: 'algolia',
				operation: 'update_object',
				indexName,
				entityId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	async deleteObject(indexName: string, entityId: string): Promise<string[]> {
		if (!indexName || !entityId) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				operation: 'delete_object',
				indexName,
				entityId,
				message: 'Missing required fields',
			});
		}

		try {
			const { results } = await this.client.searchSingleIndex({
				indexName,
				searchParams: {
					filters: `id:${entityId}`,
				},
			});

			const hits = results[0]?.hits;

			if (!hits?.length) {
				this.logger.warn('Attempted to delete an algolia record that did not exist', {
					entityId,
					indexName,
					searchParams: {
						filters: `id:${entityId}`,
					},
				});
				return [];
			}

			const objectIDs = hits.map((hit) => hit.objectID);
			await this.client.deleteObjects({
				indexName,
				objectIDs,
			});
			return objectIDs;
		} catch (error) {
			throw AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE, {
				service: 'algolia',
				operation: 'delete_object',
				indexName,
				entityId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
