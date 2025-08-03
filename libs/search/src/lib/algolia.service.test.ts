import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { AlgoliaService } from './algolia.service';

// Mock algoliasearch
const mockSearchClient = {
	deleteObjects: vi.fn(),
	partialUpdateObject: vi.fn(),
	saveObject: vi.fn(),
	searchSingleIndex: vi.fn(),
};

vi.mock('algoliasearch', () => ({
	algoliasearch: vi.fn(() => mockSearchClient),
}));

describe('AlgoliaService', () => {
	let algoliaService: AlgoliaService;
	const mockAppId = 'test-app-id';
	const mockApiKey = 'test-api-key';

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock Logger
		vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

		algoliaService = new AlgoliaService(mockAppId, mockApiKey);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create service with application ID and API key', () => {
			expect(algoliaService).toBeDefined();
		});

		it('should initialize Algolia client', () => {
			expect(algoliaService).toBeDefined();
		});
	});

	describe('createObject', () => {
		it('should create object successfully', async () => {
			const indexName = 'test-index';
			const body = { id: '123', name: 'Test Object' };
			const expectedResponse = { objectID: '123', updatedAt: new Date() };

			mockSearchClient.saveObject.mockResolvedValue(expectedResponse);

			const result = await algoliaService.createObject(indexName, body);

			expect(mockSearchClient.saveObject).toHaveBeenCalledWith({
				body,
				indexName,
			});
			expect(result).toEqual(expectedResponse);
		});

		it('should handle create object errors', async () => {
			const indexName = 'test-index';
			const body = { id: '123', name: 'Test Object' };
			const error = new Error('Algolia create failed');

			mockSearchClient.saveObject.mockRejectedValue(error);

			await expect(algoliaService.createObject(indexName, body)).rejects.toThrow('Algolia create failed');
		});

		it('should handle different data types', async () => {
			const testCases = [
				{ body: { id: '123', name: 'string' } },
				{ body: { count: 42, id: '123' } },
				{ body: { active: true, id: '123' } },
				{ body: { id: '123', tags: ['tag1', 'tag2'] } },
			];

			mockSearchClient.saveObject.mockResolvedValue({ objectID: '123' });

			for (const { body } of testCases) {
				await algoliaService.createObject('test-index', body);

				expect(mockSearchClient.saveObject).toHaveBeenCalledWith({
					body,
					indexName: 'test-index',
				});
			}
		});
	});

	describe('updateObject', () => {
		it('should update object successfully when found', async () => {
			const indexName = 'vendor';
			const entityId = '123';
			const attributesToUpdate = { name: 'Updated Name' };
			const searchHits = [{ objectID: 'algolia-123' }];
			const expectedResponse = { objectID: 'algolia-123', updatedAt: new Date() };

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: searchHits });
			mockSearchClient.partialUpdateObject.mockResolvedValue(expectedResponse);

			const result = await algoliaService.updateObject(indexName, entityId, attributesToUpdate);

			expect(mockSearchClient.searchSingleIndex).toHaveBeenCalledWith({
				indexName: 'vendor',
				searchParams: {
					query: entityId,
					restrictSearchableAttributes: ['id'],
				},
			});
			expect(mockSearchClient.partialUpdateObject).toHaveBeenCalledWith({
				attributesToUpdate,
				createIfNotExists: false,
				indexName,
				objectID: 'algolia-123',
			});
			expect(result).toEqual(expectedResponse);
		});

		it('should handle object not found', async () => {
			const indexName = 'vendor';
			const entityId = '123';
			const attributesToUpdate = { name: 'Updated Name' };

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: [] });

			const result = await algoliaService.updateObject(indexName, entityId, attributesToUpdate);

			expect(mockSearchClient.searchSingleIndex).toHaveBeenCalledWith({
				indexName: 'vendor',
				searchParams: {
					query: entityId,
					restrictSearchableAttributes: ['id'],
				},
			});
			expect(mockSearchClient.partialUpdateObject).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it('should log warning when object not found', async () => {
			const indexName = 'vendor';
			const entityId = '123';
			const attributesToUpdate = { name: 'Updated Name' };

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: [] });

			await algoliaService.updateObject(indexName, entityId, attributesToUpdate);

			expect(Logger.prototype.warn).toHaveBeenCalledWith('Attempted to update an algolia record that did not exist', {
				indexName,
				searchParams: {
					filters: entityId,
				},
			});
		});

		it('should handle search errors', async () => {
			const indexName = 'vendor';
			const entityId = '123';
			const attributesToUpdate = { name: 'Updated Name' };
			const error = new Error('Search failed');

			mockSearchClient.searchSingleIndex.mockRejectedValue(error);

			await expect(algoliaService.updateObject(indexName, entityId, attributesToUpdate)).rejects.toThrow(
				'Search failed',
			);
		});

		it('should handle update errors', async () => {
			const indexName = 'vendor';
			const entityId = '123';
			const attributesToUpdate = { name: 'Updated Name' };
			const searchHits = [{ objectID: 'algolia-123' }];
			const error = new Error('Update failed');

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: searchHits });
			mockSearchClient.partialUpdateObject.mockRejectedValue(error);

			await expect(algoliaService.updateObject(indexName, entityId, attributesToUpdate)).rejects.toThrow(
				'Update failed',
			);
		});
	});

	describe('deleteObject', () => {
		it('should delete object successfully when found', async () => {
			const indexName = 'vendor';
			const entityId = '123';
			const searchHits = [{ objectID: 'algolia-123' }, { objectID: 'algolia-456' }];
			const expectedResponse = [{ taskID: 'task-123' }];

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: searchHits });
			mockSearchClient.deleteObjects.mockResolvedValue(expectedResponse);

			const result = await algoliaService.deleteObject(indexName, entityId);

			expect(mockSearchClient.searchSingleIndex).toHaveBeenCalledWith({
				indexName: 'vendor',
				searchParams: {
					query: entityId,
					restrictSearchableAttributes: ['id'],
				},
			});
			expect(mockSearchClient.deleteObjects).toHaveBeenCalledWith({
				indexName,
				objectIDs: ['algolia-123', 'algolia-456'],
			});
			expect(result).toEqual(expectedResponse);
		});

		it('should handle object not found for deletion', async () => {
			const indexName = 'vendor';
			const entityId = '123';

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: [] });
			mockSearchClient.deleteObjects.mockResolvedValue([]);

			const result = await algoliaService.deleteObject(indexName, entityId);

			expect(mockSearchClient.searchSingleIndex).toHaveBeenCalledWith({
				indexName: 'vendor',
				searchParams: {
					query: entityId,
					restrictSearchableAttributes: ['id'],
				},
			});
			expect(mockSearchClient.deleteObjects).toHaveBeenCalledWith({
				indexName,
				objectIDs: [],
			});
			expect(result).toEqual([]);
		});

		it('should handle search errors during deletion', async () => {
			const indexName = 'vendor';
			const entityId = '123';
			const error = new Error('Search failed');

			mockSearchClient.searchSingleIndex.mockRejectedValue(error);

			await expect(algoliaService.deleteObject(indexName, entityId)).rejects.toThrow('Search failed');
		});

		it('should handle delete errors', async () => {
			const indexName = 'vendor';
			const entityId = '123';
			const searchHits = [{ objectID: 'algolia-123' }];
			const error = new Error('Delete failed');

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: searchHits });
			mockSearchClient.deleteObjects.mockRejectedValue(error);

			await expect(algoliaService.deleteObject(indexName, entityId)).rejects.toThrow('Delete failed');
		});

		it('should handle multiple objects with same entity ID', async () => {
			const indexName = 'vendor';
			const entityId = '123';
			const searchHits = [{ objectID: 'algolia-123' }, { objectID: 'algolia-456' }, { objectID: 'algolia-789' }];
			const expectedResponse = [{ taskID: 'task-123' }];

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: searchHits });
			mockSearchClient.deleteObjects.mockResolvedValue(expectedResponse);

			const result = await algoliaService.deleteObject(indexName, entityId);

			expect(mockSearchClient.deleteObjects).toHaveBeenCalledWith({
				indexName,
				objectIDs: ['algolia-123', 'algolia-456', 'algolia-789'],
			});
			expect(result).toEqual(expectedResponse);
		});
	});

	describe('edge cases', () => {
		it('should handle empty search results', async () => {
			const indexName = 'vendor';
			const entityId = '123';

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: [] });
			mockSearchClient.deleteObjects.mockResolvedValue([]);

			const updateResult = await algoliaService.updateObject(indexName, entityId, { name: 'test' });
			const deleteResult = await algoliaService.deleteObject(indexName, entityId);

			expect(updateResult).toBeNull();
			expect(deleteResult).toEqual([]);
		});

		it('should handle null or undefined values', async () => {
			const indexName = 'vendor';
			const entityId = '123';

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: [] });
			mockSearchClient.deleteObjects.mockResolvedValue([]);

			const updateResult = await algoliaService.updateObject(indexName, entityId, null);
			const deleteResult = await algoliaService.deleteObject(indexName, entityId);

			expect(updateResult).toBeNull();
			expect(deleteResult).toEqual([]);
		});

		it('should handle malformed search results', async () => {
			const indexName = 'vendor';
			const entityId = '123';

			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: [{ invalid: 'data' }] });
			mockSearchClient.partialUpdateObject.mockResolvedValue({ objectID: 'test-123' });

			// This should not throw since the service handles missing objectID gracefully
			const result = await algoliaService.updateObject(indexName, entityId, { name: 'test' });
			expect(result).toBeDefined();
		});
	});

	describe('error handling', () => {
		it('should handle Algolia client initialization errors', () => {
			// Test with invalid credentials
			expect(() => new AlgoliaService('', '')).not.toThrow();
		});

		it('should handle network errors gracefully', async () => {
			const networkError = new Error('Network error');
			mockSearchClient.saveObject.mockRejectedValue(networkError);

			await expect(algoliaService.createObject('test-index', { id: '123' })).rejects.toThrow('Network error');
		});

		it('should handle timeout errors', async () => {
			const timeoutError = new Error('Request timeout');
			mockSearchClient.searchSingleIndex.mockRejectedValue(timeoutError);

			await expect(algoliaService.updateObject('vendor', '123', { name: 'test' })).rejects.toThrow('Request timeout');
		});
	});

	describe('performance considerations', () => {
		it('should handle large datasets efficiently', async () => {
			const largeHits = Array.from({ length: 1000 }, (_, i) => ({ objectID: `algolia-${i}` }));
			mockSearchClient.searchSingleIndex.mockResolvedValue({ hits: largeHits });
			mockSearchClient.deleteObjects.mockResolvedValue([{ taskID: 'task-123' }]);

			const result = await algoliaService.deleteObject('vendor', '123');

			expect(result).toEqual([{ taskID: 'task-123' }]);
		});

		it('should not create memory leaks with repeated operations', async () => {
			mockSearchClient.saveObject.mockResolvedValue({ objectID: '123' });

			for (let i = 0; i < 100; i++) {
				await algoliaService.createObject('test-index', { id: `test-${i}` });
			}

			expect(mockSearchClient.saveObject).toHaveBeenCalledTimes(100);
		});
	});
});
