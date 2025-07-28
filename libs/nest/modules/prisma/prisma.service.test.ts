import { Logger } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
vi.mock('@prisma/client', () => ({
	PrismaClient: vi.fn(),
}));

// Mock Pulse extension
vi.mock('@prisma/extension-pulse', () => ({
	withPulse: vi.fn(() => vi.fn()),
}));

describe('PrismaService', () => {
	let prismaService: PrismaService;
	let mockPrismaClient: vi.Mocked<PrismaClient>;
	const connectionString = 'postgresql://user:pass@localhost:5432/db';
	const pulseKey = 'pulse-api-key';

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock PrismaClient instance
		mockPrismaClient = {
			$connect: vi.fn(),
			$disconnect: vi.fn(),
			$on: vi.fn(),
			$extends: vi.fn(() => ({ pulseClient: true })),
		} as any;

		(PrismaClient as any).mockImplementation(() => mockPrismaClient);

		// Mock Logger
		vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
		vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create PrismaClient with correct configuration', () => {
			prismaService = new PrismaService(connectionString, pulseKey);

			expect(PrismaClient).toHaveBeenCalledWith({
				datasources: {
					db: {
						url: connectionString,
					},
				},
				log: [
					{ emit: 'event', level: 'query' },
					{ emit: 'event', level: 'error' },
				],
			});
		});

		it('should set up error event listener', () => {
			prismaService = new PrismaService(connectionString, pulseKey);

			expect(mockPrismaClient.$on).toHaveBeenCalledWith('error', expect.any(Function));
		});

		it('should set up query event listener', () => {
			prismaService = new PrismaService(connectionString, pulseKey);

			expect(mockPrismaClient.$on).toHaveBeenCalledWith('query', expect.any(Function));
		});

		it('should create Pulse client with API key', () => {
			prismaService = new PrismaService(connectionString, pulseKey);

			expect(mockPrismaClient.$extends).toHaveBeenCalled();
		});
	});

	describe('event handlers', () => {
		beforeEach(() => {
			prismaService = new PrismaService(connectionString, pulseKey);
		});

		it('should log error events', () => {
			const errorEvent = { message: 'Database error', code: 'P2002' };
			
			// Get the error event handler
			const errorHandler = mockPrismaClient.$on.mock.calls.find(
				call => call[0] === 'error'
			)[1];

			errorHandler(errorEvent);

			expect(Logger.prototype.error).toHaveBeenCalledWith(errorEvent);
		});

		it('should log query events', () => {
			const queryEvent = {
				duration: 150,
				params: ['param1', 'param2'],
				query: 'SELECT * FROM users WHERE id = ?',
			};

			// Get the query event handler
			const queryHandler = mockPrismaClient.$on.mock.calls.find(
				call => call[0] === 'query'
			)[1];

			queryHandler(queryEvent);

			expect(Logger.prototype.log).toHaveBeenCalledWith({
				duration: 150,
				params: ['param1', 'param2'],
				query: 'SELECT * FROM users WHERE id = ?',
			});
		});
	});

	describe('getters', () => {
		beforeEach(() => {
			prismaService = new PrismaService(connectionString, pulseKey);
		});

		it('should return the main database client', () => {
			const dbClient = prismaService.db;

			expect(dbClient).toBe(mockPrismaClient);
		});

		it('should return the Pulse client', () => {
			const pulseClient = prismaService.pulse;

			expect(pulseClient).toBeDefined();
		});
	});

	describe('lifecycle methods', () => {
		beforeEach(() => {
			prismaService = new PrismaService(connectionString, pulseKey);
		});

		it('should connect to database on module init', async () => {
			mockPrismaClient.$connect.mockResolvedValue(undefined);

			await prismaService.onModuleInit();

			expect(mockPrismaClient.$connect).toHaveBeenCalled();
		});

		it('should disconnect from database on module destroy', async () => {
			mockPrismaClient.$disconnect.mockResolvedValue(undefined);

			await prismaService.onModuleDestroy();

			expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
		});

		it('should handle connection errors gracefully', async () => {
			const connectionError = new Error('Connection failed');
			mockPrismaClient.$connect.mockRejectedValue(connectionError);

			await expect(prismaService.onModuleInit()).rejects.toThrow('Connection failed');
		});

		it('should handle disconnection errors gracefully', async () => {
			const disconnectionError = new Error('Disconnection failed');
			mockPrismaClient.$disconnect.mockRejectedValue(disconnectionError);

			await expect(prismaService.onModuleDestroy()).rejects.toThrow('Disconnection failed');
		});
	});

	describe('edge cases', () => {
		it('should handle empty connection string', () => {
			expect(() => new PrismaService('', pulseKey)).not.toThrow();
		});

		it('should handle empty pulse key', () => {
			expect(() => new PrismaService(connectionString, '')).not.toThrow();
		});

		it('should handle null connection string', () => {
			expect(() => new PrismaService(null as any, pulseKey)).not.toThrow();
		});

		it('should handle null pulse key', () => {
			expect(() => new PrismaService(connectionString, null as any)).not.toThrow();
		});

		it('should handle undefined connection string', () => {
			expect(() => new PrismaService(undefined as any, pulseKey)).not.toThrow();
		});

		it('should handle undefined pulse key', () => {
			expect(() => new PrismaService(connectionString, undefined as any)).not.toThrow();
		});
	});

	describe('multiple instances', () => {
		it('should create separate clients for different instances', () => {
			// Create separate mock instances
			const mockClient1 = { ...mockPrismaClient, id: 'client1' };
			const mockClient2 = { ...mockPrismaClient, id: 'client2' };
			
			(PrismaClient as any).mockImplementationOnce(() => mockClient1);
			(PrismaClient as any).mockImplementationOnce(() => mockClient2);
			
			const service1 = new PrismaService(connectionString, pulseKey);
			const service2 = new PrismaService('different-url', 'different-key');

			expect(service1.db).toBe(mockClient1);
			expect(service2.db).toBe(mockClient2);
		});

		it('should have separate Pulse clients for different instances', () => {
			// Create separate mock instances with different Pulse clients
			const mockClient1 = { ...mockPrismaClient, $extends: vi.fn(() => ({ pulseClient: 'pulse1' })) };
			const mockClient2 = { ...mockPrismaClient, $extends: vi.fn(() => ({ pulseClient: 'pulse2' })) };
			
			(PrismaClient as any).mockImplementationOnce(() => mockClient1);
			(PrismaClient as any).mockImplementationOnce(() => mockClient2);
			
			const service1 = new PrismaService(connectionString, pulseKey);
			const service2 = new PrismaService('different-url', 'different-key');

			expect(service1.pulse).toEqual({ pulseClient: 'pulse1' });
			expect(service2.pulse).toEqual({ pulseClient: 'pulse2' });
		});
	});
}); 