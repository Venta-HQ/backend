import { algoliasearch, BatchResponse, SearchClient, UpdatedAtWithObjectIdResponse } from 'algoliasearch';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AlgoliaService {
	private client: SearchClient;
	private readonly logger = new Logger(AlgoliaService.name);

	constructor(applicationId: string, apiKey: string) {
		this.client = algoliasearch(applicationId, apiKey);
	}

	async createObject(indexName: string, body: any): Promise<UpdatedAtWithObjectIdResponse> {
		return await this.client.saveObject({
			body,
			indexName,
		});
	}

	async updateObject(
		indexName: string,
		entityId: string,
		attributesToUpdate: any,
	): Promise<UpdatedAtWithObjectIdResponse> {
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
			return;
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
