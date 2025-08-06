import { algoliasearch, BatchResponse, SearchClient, UpdatedAtWithObjectIdResponse } from 'algoliasearch';
import { Injectable, Logger } from '@nestjs/common';

// Define proper types for Algolia operations
export interface AlgoliaObject {
	[key: string]: string | number | boolean | Date | null | undefined;
}

export interface AlgoliaUpdateAttributes {
	[key: string]: string | number | boolean | Date | null | undefined;
}

@Injectable()
export class AlgoliaService {
	private client: SearchClient;
	private readonly logger = new Logger(AlgoliaService.name);

	constructor(applicationId: string, apiKey: string) {
		this.client = algoliasearch(applicationId, apiKey);
	}

	async createObject(indexName: string, body: AlgoliaObject): Promise<UpdatedAtWithObjectIdResponse> {
		return await this.client.saveObject({
			body,
			indexName,
		});
	}

	async updateObject(
		indexName: string,
		entityId: string,
		attributesToUpdate: AlgoliaUpdateAttributes,
	): Promise<UpdatedAtWithObjectIdResponse | null> {
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
	}

	async deleteObject(indexName: string, entityId: string): Promise<BatchResponse[]> {
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
	}
}
