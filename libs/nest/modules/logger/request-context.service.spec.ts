import { describe, it, expect, beforeEach } from 'vitest';
import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
	let service: RequestContextService;

	beforeEach(() => {
		service = new RequestContextService();
	});

	describe('set', () => {
		it('should store a value in context', () => {
			service.set('testKey', 'testValue');
			expect(service.get('testKey')).toBe('testValue');
		});

		it('should overwrite existing values', () => {
			service.set('testKey', 'initialValue');
			service.set('testKey', 'updatedValue');
			expect(service.get('testKey')).toBe('updatedValue');
		});

		it('should store different types of values', () => {
			service.set('string', 'test');
			service.set('number', 123);
			service.set('boolean', true);
			service.set('object', { key: 'value' });
			service.set('array', [1, 2, 3]);

			expect(service.get('string')).toBe('test');
			expect(service.get('number')).toBe(123);
			expect(service.get('boolean')).toBe(true);
			expect(service.get('object')).toEqual({ key: 'value' });
			expect(service.get('array')).toEqual([1, 2, 3]);
		});
	});

	describe('get', () => {
		it('should return undefined for non-existent keys', () => {
			expect(service.get('nonExistentKey')).toBeUndefined();
		});

		it('should return stored values', () => {
			service.set('testKey', 'testValue');
			expect(service.get('testKey')).toBe('testValue');
		});

		it('should return null values', () => {
			service.set('nullKey', null);
			expect(service.get('nullKey')).toBeNull();
		});

		it('should return undefined values', () => {
			service.set('undefinedKey', undefined);
			expect(service.get('undefinedKey')).toBeUndefined();
		});
	});

	describe('clear', () => {
		it('should remove all stored values', () => {
			service.set('key1', 'value1');
			service.set('key2', 'value2');
			
			service.clear();
			
			expect(service.get('key1')).toBeUndefined();
			expect(service.get('key2')).toBeUndefined();
		});

		it('should allow setting new values after clear', () => {
			service.set('key1', 'value1');
			service.clear();
			service.set('key2', 'value2');
			
			expect(service.get('key1')).toBeUndefined();
			expect(service.get('key2')).toBe('value2');
		});
	});

	describe('context isolation', () => {
		it('should maintain separate contexts for different instances', () => {
			const service1 = new RequestContextService();
			const service2 = new RequestContextService();

			service1.set('key', 'value1');
			service2.set('key', 'value2');

			expect(service1.get('key')).toBe('value1');
			expect(service2.get('key')).toBe('value2');
		});
	});
}); 