import { Test, TestingModule } from '@nestjs/testing';
import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
	let service: RequestContextService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [RequestContextService],
		}).compile();

		service = await module.resolve<RequestContextService>(RequestContextService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('set and get', () => {
		it('should set and retrieve a value', () => {
			service.set('testKey', 'testValue');
			expect(service.get('testKey')).toBe('testValue');
		});

		it('should overwrite existing values', () => {
			service.set('testKey', 'initialValue');
			service.set('testKey', 'updatedValue');
			expect(service.get('testKey')).toBe('updatedValue');
		});

		it('should return undefined for non-existent keys', () => {
			expect(service.get('nonExistentKey')).toBeUndefined();
		});

		it('should handle different data types', () => {
			const testData = {
				string: 'test',
				number: 42,
				boolean: true,
				object: { key: 'value' },
				array: [1, 2, 3],
				null: null,
			};

			Object.entries(testData).forEach(([key, value]) => {
				service.set(key, value);
				expect(service.get(key)).toEqual(value);
			});
		});
	});

	describe('has', () => {
		it('should return true for existing keys', () => {
			service.set('testKey', 'testValue');
			expect(service.has('testKey')).toBe(true);
		});

		it('should return false for non-existent keys', () => {
			expect(service.has('nonExistentKey')).toBe(false);
		});

		it('should return false after deletion', () => {
			service.set('testKey', 'testValue');
			service.delete('testKey');
			expect(service.has('testKey')).toBe(false);
		});
	});

	describe('delete', () => {
		it('should delete existing keys', () => {
			service.set('testKey', 'testValue');
			expect(service.delete('testKey')).toBe(true);
			expect(service.get('testKey')).toBeUndefined();
		});

		it('should return false for non-existent keys', () => {
			expect(service.delete('nonExistentKey')).toBe(false);
		});
	});

	describe('clear', () => {
		it('should clear all data', () => {
			service.set('key1', 'value1');
			service.set('key2', 'value2');
			service.set('key3', 'value3');

			expect(service.size()).toBe(3);

			service.clear();

			expect(service.size()).toBe(0);
			expect(service.get('key1')).toBeUndefined();
			expect(service.get('key2')).toBeUndefined();
			expect(service.get('key3')).toBeUndefined();
		});

		it('should work on empty context', () => {
			expect(service.size()).toBe(0);
			service.clear();
			expect(service.size()).toBe(0);
		});
	});

	describe('keys', () => {
		it('should return all keys', () => {
			service.set('key1', 'value1');
			service.set('key2', 'value2');
			service.set('key3', 'value3');

			const keys = service.keys();
			expect(keys).toHaveLength(3);
			expect(keys).toContain('key1');
			expect(keys).toContain('key2');
			expect(keys).toContain('key3');
		});

		it('should return empty array for empty context', () => {
			expect(service.keys()).toEqual([]);
		});
	});

	describe('values', () => {
		it('should return all values', () => {
			service.set('key1', 'value1');
			service.set('key2', 'value2');
			service.set('key3', 'value3');

			const values = service.values();
			expect(values).toHaveLength(3);
			expect(values).toContain('value1');
			expect(values).toContain('value2');
			expect(values).toContain('value3');
		});

		it('should return empty array for empty context', () => {
			expect(service.values()).toEqual([]);
		});
	});

	describe('entries', () => {
		it('should return all key-value pairs', () => {
			service.set('key1', 'value1');
			service.set('key2', 'value2');

			const entries = service.entries();
			expect(entries).toHaveLength(2);
			expect(entries).toContainEqual(['key1', 'value1']);
			expect(entries).toContainEqual(['key2', 'value2']);
		});

		it('should return empty array for empty context', () => {
			expect(service.entries()).toEqual([]);
		});
	});

	describe('size', () => {
		it('should return correct size', () => {
			expect(service.size()).toBe(0);

			service.set('key1', 'value1');
			expect(service.size()).toBe(1);

			service.set('key2', 'value2');
			expect(service.size()).toBe(2);

			service.delete('key1');
			expect(service.size()).toBe(1);

			service.clear();
			expect(service.size()).toBe(0);
		});
	});

	describe('request ID specific tests', () => {
		it('should handle request ID storage and retrieval', () => {
			const requestId = 'req-123-456';
			service.set('requestId', requestId);
			expect(service.get('requestId')).toBe(requestId);
		});

		it('should handle multiple request context values', () => {
			service.set('requestId', 'req-123');
			service.set('userId', 'user-456');
			service.set('correlationId', 'corr-789');

			expect(service.get('requestId')).toBe('req-123');
			expect(service.get('userId')).toBe('user-456');
			expect(service.get('correlationId')).toBe('corr-789');
		});
	});
});
