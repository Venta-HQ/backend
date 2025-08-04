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
			indexName: 'vendor',
			searchParams: {
				query: entityId,
				restrictSearchableAttributes: ['id'],
			},
		});

		if (!hits.length) {
			this.logger.warn('Attempted to update an algolia record that did not exist', {
				indexName,
				searchParams: {
					filters: entityId,
				},
			});
			return null;
		}

		return await this.client.partialUpdateObject({
			attributesToUpdate,
			createIfNotExists: false,
			indexName,
			objectID: hits[0].objectID,
		});
	}

	async deleteObject(indexName: string, entityId: string): Promise<BatchResponse[]> {
		const { hits } = await this.client.searchSingleIndex({
			indexName: 'vendor',
			searchParams: {
				query: entityId,
				restrictSearchableAttributes: ['id'],
			},
		});

		return await this.client.deleteObjects({
			indexName,
			objectIDs: hits.map((hit) => hit.objectID),
		});
	}
}
