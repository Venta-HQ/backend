import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
	let requestContextService: RequestContextService;

	beforeEach(() => {
		requestContextService = new RequestContextService();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create service with AsyncLocalStorage', () => {
			expect(requestContextService).toBeDefined();
		});
	});

	describe('set method', () => {
		it('should set value in context when store exists', () => {
			const key = 'testKey';
			const value = 'testValue';

			// Run in context to create store
			requestContextService.run(() => {
				requestContextService.set(key, value);
				const retrievedValue = requestContextService.get(key);
				expect(retrievedValue).toBe(value);
			});
		});

		it('should handle setting multiple values', () => {
			const testData = {
				requestId: 'req-456',
				timestamp: new Date().toISOString(),
				userId: '123',
			};

			requestContextService.run(() => {
				Object.entries(testData).forEach(([key, value]) => {
					requestContextService.set(key, value);
				});

				Object.entries(testData).forEach(([key, value]) => {
					expect(requestContextService.get(key)).toBe(value);
				});
			});
		});

		it('should overwrite existing values', () => {
			const key = 'counter';
			const initialValue = 1;
			const updatedValue = 2;

			requestContextService.run(() => {
				requestContextService.set(key, initialValue);
				expect(requestContextService.get(key)).toBe(initialValue);

				requestContextService.set(key, updatedValue);
				expect(requestContextService.get(key)).toBe(updatedValue);
			});
		});

		it('should handle setting null and undefined values', () => {
			requestContextService.run(() => {
				requestContextService.set('nullValue', null);
				requestContextService.set('undefinedValue', undefined);

				expect(requestContextService.get('nullValue')).toBeNull();
				expect(requestContextService.get('undefinedValue')).toBeUndefined();
			});
		});

		it('should handle setting complex objects', () => {
			const complexObject = {
				metadata: {
					timestamp: new Date(),
					version: '1.0.0',
				},
				user: {
					id: '123',
					name: 'John Doe',
					preferences: {
						language: 'en',
						theme: 'dark',
					},
				},
			};

			requestContextService.run(() => {
				requestContextService.set('complexData', complexObject);
				const retrieved = requestContextService.get('complexData');

				expect(retrieved).toEqual(complexObject);
				expect(retrieved.user.name).toBe('John Doe');
				expect(retrieved.metadata.version).toBe('1.0.0');
			});
		});

		it('should handle setting when no store exists', () => {
			// Test setting without running in context
			expect(() => {
				requestContextService.set('key', 'value');
			}).not.toThrow();

			// Should not be able to retrieve the value
			expect(requestContextService.get('key')).toBeUndefined();
		});
	});

	describe('get method', () => {
		it('should retrieve value from context when store exists', () => {
			const key = 'testKey';
			const value = 'testValue';

			requestContextService.run(() => {
				requestContextService.set(key, value);
				const retrievedValue = requestContextService.get(key);
				expect(retrievedValue).toBe(value);
			});
		});

		it('should return undefined for non-existent keys', () => {
			requestContextService.run(() => {
				const nonExistentValue = requestContextService.get('nonExistentKey');
				expect(nonExistentValue).toBeUndefined();
			});
		});

		it('should return undefined when no store exists', () => {
			const value = requestContextService.get('anyKey');
			expect(value).toBeUndefined();
		});

		it('should handle different data types', () => {
			const testCases = [
				{ key: 'string', value: 'hello world' },
				{ key: 'number', value: 42 },
				{ key: 'boolean', value: true },
				{ key: 'array', value: [1, 2, 3] },
				{ key: 'object', value: { key: 'value' } },
				{ key: 'null', value: null },
				{ key: 'undefined', value: undefined },
			];

			requestContextService.run(() => {
				testCases.forEach(({ key, value }) => {
					requestContextService.set(key, value);
					expect(requestContextService.get(key)).toEqual(value);
				});
			});
		});

		it('should handle empty string keys', () => {
			requestContextService.run(() => {
				requestContextService.set('', 'empty key value');
				expect(requestContextService.get('')).toBe('empty key value');
			});
		});

		it('should handle special characters in keys', () => {
			const specialKeys = [
				'key.with.dots',
				'key-with-dashes',
				'key_with_underscores',
				'key with spaces',
				'key@#$%^&*()',
			];

			requestContextService.run(() => {
				specialKeys.forEach((key, index) => {
					requestContextService.set(key, `value-${index}`);
					expect(requestContextService.get(key)).toBe(`value-${index}`);
				});
			});
		});
	});

	describe('run method', () => {
		it('should execute callback with new context', () => {
			const callback = vi.fn();
			const testValue = 'test';

			requestContextService.run(() => {
				requestContextService.set('key', testValue);
				callback();
			});

			expect(callback).toHaveBeenCalled();
			// Context should not persist outside of run
			expect(requestContextService.get('key')).toBeUndefined();
		});

		it('should return callback result', () => {
			const expectedResult = 'callback result';
			const callback = vi.fn(() => expectedResult);

			const result = requestContextService.run(callback);

			expect(callback).toHaveBeenCalled();
			expect(result).toBe(expectedResult);
		});

		it('should handle async callbacks', async () => {
			const asyncCallback = vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return 'async result';
			});

			const result = await requestContextService.run(asyncCallback);

			expect(asyncCallback).toHaveBeenCalled();
			expect(result).toBe('async result');
		});

		it('should handle callbacks that throw errors', () => {
			const errorMessage = 'Test error';
			const errorCallback = vi.fn(() => {
				throw new Error(errorMessage);
			});

			expect(() => {
				requestContextService.run(errorCallback);
			}).toThrow(errorMessage);

			expect(errorCallback).toHaveBeenCalled();
		});

		it('should handle callbacks with parameters', () => {
			const callback = vi.fn((param1: string, param2: number) => {
				requestContextService.set('param1', param1);
				requestContextService.set('param2', param2);
				return `${param1}-${param2}`;
			});

			const result = requestContextService.run(callback, 'test', 42);

			expect(callback).toHaveBeenCalledWith('test', 42);
			expect(result).toBe('test-42');
		});

		it('should isolate contexts between different runs', () => {
			requestContextService.run(() => {
				requestContextService.set('isolated', 'first');
			});

			requestContextService.run(() => {
				requestContextService.set('isolated', 'second');
				expect(requestContextService.get('isolated')).toBe('second');
			});

			// Outside of any run, should be undefined
			expect(requestContextService.get('isolated')).toBeUndefined();
		});

		it('should handle nested runs', () => {
			const outerValue = 'outer';
			const innerValue = 'inner';

			requestContextService.run(() => {
				requestContextService.set('level', outerValue);
				expect(requestContextService.get('level')).toBe(outerValue);

				requestContextService.run(() => {
					requestContextService.set('level', innerValue);
					expect(requestContextService.get('level')).toBe(innerValue);
				});

				// Should still have outer value after inner run completes
				expect(requestContextService.get('level')).toBe(outerValue);
			});
		});
	});

	describe('context isolation', () => {
		it('should not share context between different service instances', () => {
			const service1 = new RequestContextService();
			const service2 = new RequestContextService();

			service1.run(() => {
				service1.set('key', 'service1-value');
				expect(service1.get('key')).toBe('service1-value');
				expect(service2.get('key')).toBeUndefined();
			});

			service2.run(() => {
				service2.set('key', 'service2-value');
				expect(service2.get('key')).toBe('service2-value');
				expect(service1.get('key')).toBeUndefined();
			});
		});

		it('should maintain context isolation across async operations', async () => {
			const result = await requestContextService.run(async () => {
				requestContextService.set('asyncKey', 'async-value');
				const asyncOperation = async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return requestContextService.get('asyncKey');
				};
				return await asyncOperation();
			});

			expect(result).toBe('async-value');

			// Outside context should not have access
			expect(requestContextService.get('asyncKey')).toBeUndefined();
		});
	});

	describe('edge cases', () => {
		it('should handle very large objects', () => {
			const largeObject = {
				data: Array.from({ length: 1000 }, (_, i) => ({
					description: `Description for item ${i}`.repeat(10),
					id: i,
					name: `Item ${i}`,
				})),
			};

			requestContextService.run(() => {
				requestContextService.set('largeData', largeObject);
				const retrieved = requestContextService.get('largeData');

				expect(retrieved).toEqual(largeObject);
				expect(retrieved.data).toHaveLength(1000);
			});
		});

		it('should handle circular references gracefully', () => {
			const circularObject: any = { name: 'circular' };
			circularObject.self = circularObject;

			requestContextService.run(() => {
				// Should not throw when setting circular reference
				expect(() => {
					requestContextService.set('circular', circularObject);
				}).not.toThrow();
			});
		});

		it('should handle concurrent access', () => {
			const promises = Array.from({ length: 10 }, (_, i) =>
				requestContextService.run(async () => {
					requestContextService.set('concurrent', i);
					await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
					return requestContextService.get('concurrent');
				}),
			);

			return Promise.all(promises).then((results) => {
				// Each run should have its own isolated context
				results.forEach((result, index) => {
					expect(result).toBe(index);
				});
			});
		});

		it('should handle memory cleanup', () => {
			// Create many contexts to test memory management
			for (let i = 0; i < 100; i++) {
				requestContextService.run(() => {
					requestContextService.set(`key-${i}`, `value-${i}`);
				});
			}

			// Should not have any lingering context
			expect(requestContextService.get('key-0')).toBeUndefined();
			expect(requestContextService.get('key-99')).toBeUndefined();
		});
	});

	describe('performance considerations', () => {
		it('should handle high-frequency context operations', () => {
			const iterations = 1000;

			for (let i = 0; i < iterations; i++) {
				requestContextService.run(() => {
					requestContextService.set(`perf-key-${i}`, `perf-value-${i}`);
					expect(requestContextService.get(`perf-key-${i}`)).toBe(`perf-value-${i}`);
				});
			}
		});

		it('should not create memory leaks with repeated operations', () => {
			const iterations = 1000;

			for (let i = 0; i < iterations; i++) {
				requestContextService.run(() => {
					requestContextService.set('memory-test', i);
				});
			}

			// Should not have any lingering context
			expect(requestContextService.get('memory-test')).toBeUndefined();
		});
	});
});
