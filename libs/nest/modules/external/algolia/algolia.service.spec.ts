import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../core/logger/logger.service';
import { AlgoliaService } from './algolia.service';

const mockClient = {
	addOrUpdateObject: vi.fn(async ({ objectID }: any) => ({ objectID })),
	searchSingleIndex: vi.fn(async () => ({ results: [{ hits: [{ objectID: 'obj1', id: 'e1' }] }] })),
	partialUpdateObject: vi.fn(async ({ objectID }: any) => ({ objectID })),
	deleteObjects: vi.fn(async () => ({})),
};

vi.mock('algoliasearch', () => ({
	algoliasearch: vi.fn(() => mockClient),
}));

describe('AlgoliaService', () => {
	let svc: AlgoliaService;

	beforeEach(() => {
		vi.clearAllMocks();
		svc = new AlgoliaService('app', 'key', new Logger());
	});

	it('createObject succeeds and returns object with objectID', async () => {
		const body = { objectID: 'obj1', id: 'e1' } as any;
		const res = await svc.createObject('idx', body);
		expect(res.objectID).toBe('obj1');
		expect(mockClient.addOrUpdateObject).toHaveBeenCalled();
	});

	it('updateObject merges attributes when hit exists', async () => {
		const res = await svc.updateObject('idx', 'e1', { name: 'New' } as any);
		expect(res).toMatchObject({ objectID: 'obj1', name: 'New' });
		expect(mockClient.searchSingleIndex).toHaveBeenCalled();
		expect(mockClient.partialUpdateObject).toHaveBeenCalled();
	});

	it('updateObject returns null when no hits', async () => {
		(mockClient.searchSingleIndex as any).mockResolvedValueOnce({ results: [{ hits: [] }] });
		const res = await svc.updateObject('idx', 'missing', { any: true } as any);
		expect(res).toBeNull();
	});

	it('deleteObject deletes found hits and returns ids', async () => {
		(mockClient.searchSingleIndex as any).mockResolvedValueOnce({
			results: [{ hits: [{ objectID: 'a' }, { objectID: 'b' }] }],
		});
		const ids = await svc.deleteObject('idx', 'e1');
		expect(ids).toEqual(['a', 'b']);
		expect(mockClient.deleteObjects).toHaveBeenCalled();
	});
});
