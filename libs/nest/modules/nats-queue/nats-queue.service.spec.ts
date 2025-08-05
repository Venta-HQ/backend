import { connect, NatsConnection, Subscription } from 'nats';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NatsQueueService } from './nats-queue.service';

// Mock the nats module
vi.mock('nats', () => ({
	connect: vi.fn(),
}));

const mockConnect = connect as any;

describe('NatsQueueService', () => {
	let service: NatsQueueService;
	let mockConfigService: any;
	let mockNatsConnection: any;
	let mockSubscription: any;

	beforeEach(async () => {
		mockConfigService = {
			get: vi.fn().mockReturnValue('nats://localhost:4222'),
		} as any;

		mockSubscription = {
			unsubscribe: vi.fn(),
			[Symbol.asyncIterator]: vi.fn().mockReturnValue((async function* () {
				// Empty async iterator by default
			})()),
		} as any;

		mockNatsConnection = {
			subscribe: vi.fn().mockReturnValue(mockSubscription),
			publish: vi.fn().mockResolvedValue(undefined),
			close: vi.fn().mockResolvedValue(undefined),
			closed: vi.fn().mockReturnValue(false),
		} as any;

		mockConnect.mockResolvedValue(mockNatsConnection);

		// Create service directly with mock config service
		service = new NatsQueueService(mockConfigService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('onModuleInit', () => {
		it('should connect to NATS server successfully', async () => {
			await service.onModuleInit();

			expect(mockConnect).toHaveBeenCalledWith({
				servers: 'nats://localhost:4222',
			});
		});

		it('should use default NATS URL when not configured', async () => {
			mockConfigService.get.mockReturnValue(undefined);

			await service.onModuleInit();

			expect(mockConnect).toHaveBeenCalledWith({
				servers: 'nats://localhost:4222',
			});
		});

		it('should handle connection errors', async () => {
			const connectionError = new Error('NATS connection failed');
			mockConnect.mockRejectedValue(connectionError);

			await expect(service.onModuleInit()).rejects.toThrow('NATS connection failed');
		});
	});

	describe('onModuleDestroy', () => {
		it('should unsubscribe from all subscriptions and close connection', async () => {
			// First initialize the service
			await service.onModuleInit();

			// Add some subscriptions
			const handler1 = vi.fn();
			const handler2 = vi.fn();
			service.subscribeToQueue('test.subject1', 'test-queue', handler1);
			service.subscribeToQueue('test.subject2', 'test-queue', handler2);

			// Now destroy
			await service.onModuleDestroy();

			expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(2);
			expect(mockNatsConnection.close).toHaveBeenCalled();
		});

		it('should handle destroy when no subscriptions exist', async () => {
			await service.onModuleInit();
			await service.onModuleDestroy();

			expect(mockNatsConnection.close).toHaveBeenCalled();
		});

		it('should handle destroy when connection is not established', async () => {
			await service.onModuleDestroy();

			expect(mockNatsConnection.close).not.toHaveBeenCalled();
		});
	});

	describe('subscribeToQueue', () => {
		beforeEach(async () => {
			await service.onModuleInit();
		});

		it('should subscribe to a subject with queue group', () => {
			const handler = vi.fn();
			service.subscribeToQueue('test.subject', 'test-queue', handler);

			expect(mockNatsConnection.subscribe).toHaveBeenCalledWith('test.subject', {
				queue: 'test-queue',
			});
		});

		it('should handle multiple subscriptions', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();

			service.subscribeToQueue('test.subject1', 'test-queue', handler1);
			service.subscribeToQueue('test.subject2', 'test-queue', handler2);

			expect(mockNatsConnection.subscribe).toHaveBeenCalledTimes(2);
		});

		it('should process messages correctly', async () => {
			const handler = vi.fn().mockResolvedValue(undefined);
			const testData = { test: 'data' };

			// Mock the async iterator for the subscription
			const mockAsyncIterator = (async function* () {
				yield {
					data: Buffer.from(JSON.stringify(testData)),
				};
			})();

			mockSubscription[Symbol.asyncIterator] = vi.fn().mockReturnValue(mockAsyncIterator);

			service.subscribeToQueue('test.subject', 'test-queue', handler);

			// Wait for the async processing to complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(handler).toHaveBeenCalledWith(testData);
		});

		it('should handle message processing errors gracefully', async () => {
			const handler = vi.fn().mockRejectedValue(new Error('Processing failed'));
			const testData = { test: 'data' };

			const mockAsyncIterator = (async function* () {
				yield {
					data: Buffer.from(JSON.stringify(testData)),
				};
			})();

			mockSubscription[Symbol.asyncIterator] = vi.fn().mockReturnValue(mockAsyncIterator);

			// Should not throw
			service.subscribeToQueue('test.subject', 'test-queue', handler);

			// Wait for the async processing to complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(handler).toHaveBeenCalledWith(testData);
		});

		it('should handle invalid JSON messages gracefully', async () => {
			const handler = vi.fn();

			const mockAsyncIterator = (async function* () {
				yield {
					data: Buffer.from('invalid json'),
				};
			})();

			mockSubscription[Symbol.asyncIterator] = vi.fn().mockReturnValue(mockAsyncIterator);

			// Should not throw
			service.subscribeToQueue('test.subject', 'test-queue', handler);

			// Wait for the async processing to complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe('subscribeToMultipleQueues', () => {
		beforeEach(async () => {
			await service.onModuleInit();
		});

		it('should subscribe to multiple subjects with same queue group', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();
			const handlers = [
				{ subject: 'test.subject1', handler: handler1 },
				{ subject: 'test.subject2', handler: handler2 },
			];

			service.subscribeToMultipleQueues(handlers, 'test-queue');

			expect(mockNatsConnection.subscribe).toHaveBeenCalledTimes(2);
			expect(mockNatsConnection.subscribe).toHaveBeenCalledWith('test.subject1', {
				queue: 'test-queue',
			});
			expect(mockNatsConnection.subscribe).toHaveBeenCalledWith('test.subject2', {
				queue: 'test-queue',
			});
		});

		it('should handle empty handlers array', () => {
			service.subscribeToMultipleQueues([], 'test-queue');

			expect(mockNatsConnection.subscribe).not.toHaveBeenCalled();
		});
	});

	describe('publish', () => {
		beforeEach(async () => {
			await service.onModuleInit();
		});

		it('should publish message successfully', async () => {
			const testData = { test: 'data' };
			await service.publish('test.subject', testData);

			expect(mockNatsConnection.publish).toHaveBeenCalledWith('test.subject', expect.stringContaining('"test":"data"'));
		});

		it('should include timestamp in published message', async () => {
			const testData = { test: 'data' };
			const beforePublish = new Date();
			await service.publish('test.subject', testData);
			const afterPublish = new Date();

			const publishedMessage = mockNatsConnection.publish.mock.calls[0][1];
			const parsedMessage = JSON.parse(publishedMessage);

			expect(parsedMessage).toMatchObject({
				test: 'data',
				timestamp: expect.any(String),
			});

			const messageTimestamp = new Date(parsedMessage.timestamp);
			expect(messageTimestamp.getTime()).toBeGreaterThanOrEqual(beforePublish.getTime());
			expect(messageTimestamp.getTime()).toBeLessThanOrEqual(afterPublish.getTime());
		});

		it('should handle publish errors', async () => {
			const publishError = new Error('Publish failed');
			mockNatsConnection.publish.mockRejectedValue(publishError);

			await expect(service.publish('test.subject', { test: 'data' })).rejects.toThrow('Publish failed');
		});

		it('should handle complex data structures', async () => {
			const complexData = {
				string: 'test',
				number: 42,
				boolean: true,
				object: { nested: 'value' },
				array: [1, 2, 3],
				null: null,
			};

			await service.publish('test.subject', complexData);

			const publishedMessage = mockNatsConnection.publish.mock.calls[0][1];
			const parsedMessage = JSON.parse(publishedMessage);

			expect(parsedMessage).toMatchObject({
				...complexData,
				timestamp: expect.any(String),
			});
		});
	});

	describe('isConnected', () => {
		it('should return false when not connected', () => {
			expect(service.isConnected()).toBe(false);
		});

		it('should return true when connected', async () => {
			await service.onModuleInit();
			mockNatsConnection.closed.mockReturnValue(false);
			expect(service.isConnected()).toBe(true);
		});

		it('should return false after connection is closed', async () => {
			await service.onModuleInit();
			mockNatsConnection.closed.mockReturnValue(true);
			expect(service.isConnected()).toBe(false);
		});
	});

	describe('error handling', () => {
		it('should handle subscription errors gracefully', async () => {
			await service.onModuleInit();

			// Mock subscription to throw an error
			mockNatsConnection.subscribe.mockImplementation(() => {
				throw new Error('Subscription failed');
			});

			const handler = vi.fn();
			expect(() => {
				service.subscribeToQueue('test.subject', 'test-queue', handler);
			}).toThrow('Subscription failed');
		});

		it('should handle connection errors during publish', async () => {
			// Don't initialize the service to simulate no connection
			const testData = { test: 'data' };

			await expect(service.publish('test.subject', testData)).rejects.toThrow();
		});
	});
});
