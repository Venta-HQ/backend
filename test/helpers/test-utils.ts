import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Simplified Test Helpers
 *
 * Everything you need for testing in one place.
 * No complex abstractions, just simple functions that work.
 */

// ============================================================================
// MOCK FACTORIES (Most Common)
// ============================================================================

/**
 * Creates a mock Prisma service
 */
export function mockPrisma() {
	return {
		db: {
			integration: {
				create: vi.fn(),
				delete: vi.fn(),
				deleteMany: vi.fn(),
				findFirst: vi.fn(),
				findMany: vi.fn(),
				update: vi.fn(),
			},
			user: {
				count: vi.fn(),
				create: vi.fn(),
				delete: vi.fn(),
				deleteMany: vi.fn(),
				findFirst: vi.fn(),
				findMany: vi.fn(),
				update: vi.fn(),
			},
			userSubscription: {
				create: vi.fn(),
				delete: vi.fn(),
				findFirst: vi.fn(),
				findMany: vi.fn(),
				update: vi.fn(),
			},
			vendor: {
				count: vi.fn(),
				create: vi.fn(),
				delete: vi.fn(),
				findFirst: vi.fn(),
				findMany: vi.fn(),
				update: vi.fn(),
			},
		},
		pulse: {},
	};
}

/**
 * Creates a mock Events service
 */
export function mockEvents() {
	return {
		publishEvent: vi.fn(),
		subscribe: vi.fn(),
		subscribeToStream: vi.fn(),
		unsubscribe: vi.fn(),
		unsubscribeFromStream: vi.fn(),
	};
}

/**
 * Creates a mock gRPC client
 */
export function mockGrpcClient() {
	return {
		getService: vi.fn(),
		invoke: vi.fn().mockReturnValue({
			pipe: vi.fn().mockReturnValue({
				subscribe: vi.fn().mockImplementation((observer) => {
					observer.next({});
					observer.complete();
					return { unsubscribe: vi.fn() };
				}),
				toPromise: vi.fn().mockResolvedValue({}),
			}),
			subscribe: vi.fn().mockImplementation((observer) => {
				observer.next({});
				observer.complete();
				return { unsubscribe: vi.fn() };
			}),
		}),
	};
}

/**
 * Creates a mock authenticated request
 */
export function mockRequest(overrides: any = {}) {
	return {
		accepts: vi.fn(),
		acceptsCharsets: vi.fn(),
		acceptsEncodings: vi.fn(),
		acceptsLanguages: vi.fn(),
		baseUrl: '',
		body: {},
		cookies: {},
		fresh: false,
		get: vi.fn(),
		header: vi.fn(),
		host: 'localhost:3000',
		hostname: 'localhost',
		ip: '127.0.0.1',
		ips: [],
		is: vi.fn(),
		method: 'GET',
		originalUrl: '/test',
		param: vi.fn(),
		params: {},
		path: '/test',
		protocol: 'http',
		query: {},
		range: vi.fn(),
		route: {},
		secure: false,
		signedCookies: {},
		stale: true,
		subdomains: [],
		url: '/test',
		userId: 'user_123',
		xhr: false,
		...overrides,
	};
}

// ============================================================================
// WEBSOCKET HELPERS
// ============================================================================

export interface MockDependencies {
	[key: string]: any;
}

export function createMockDependencies(overrides: MockDependencies = {}): MockDependencies {
	const defaults = {
		clerkService: {
			getUser: vi.fn(),
			getVendor: vi.fn(),
		},
		connectionManager: {
			addUserToVendorRoom: vi.fn(),
			getUserVendorRooms: vi.fn(),
			handleDisconnect: vi.fn(),
			registerUser: vi.fn(),
			registerVendor: vi.fn(),
			removeUserFromVendorRoom: vi.fn(),
		},
		// Common service mocks
		grpcClient: {
			getService: vi.fn(),
			invoke: vi.fn(),
		},
		// Common metrics mocks
		metrics: {
			dec: vi.fn(),
			inc: vi.fn(),
			observe: vi.fn(),
			set: vi.fn(),
		},
		redis: {
			del: vi.fn(),
			geopos: vi.fn(),
			geosearch: vi.fn(),
			get: vi.fn(),
			set: vi.fn(),
			zadd: vi.fn(),
			zrem: vi.fn(),
		},
	};

	return { ...defaults, ...overrides };
}

export function createTestModule(
	providers: any[],
	imports: any[] = [],
	additionalProviders: any[] = [],
): Promise<TestingModule> {
	return Test.createTestingModule({
		imports,
		providers: [...providers, ...additionalProviders],
	}).compile();
}

export function createMockSocket(overrides: any = {}) {
	const eventHandlers: Record<string, (...args: any[]) => any> = {};

	return {
		clerkId: 'clerk-123',
		emit: vi.fn(),
		id: 'socket-123',
		join: vi.fn(),
		leave: vi.fn(),
		on: vi.fn((event: string, handler: (...args: any[]) => any) => {
			eventHandlers[event] = handler;
		}),
		// Support for vendor gateway's to() method
		to: vi.fn((_room: string) => ({
			emit: vi.fn(),
		})),
		// Helper method to trigger events with correct context
		triggerEvent: function (event: string, data: any, context?: any) {
			const handler = eventHandlers[event];
			if (handler) {
				// Call the handler with the provided context (gateway instance)
				return handler.call(context || this, data);
			}
		},
		userId: 'user-123',
		vendorId: 'vendor-123',
		...overrides,
	};
}

export function createMockServer() {
	return {
		emit: vi.fn(),
	};
}

export function createMockMetrics(metricNames: string[] = []) {
	const metrics: any = {};

	metricNames.forEach((name) => {
		metrics[name] = {
			dec: vi.fn(),
			inc: vi.fn(),
			observe: vi.fn(),
			set: vi.fn(),
		};
	});

	return metrics;
}

export function createMockProvider(token: string, mockValue: any) {
	return {
		provide: token,
		useValue: mockValue,
	};
}

// ============================================================================
// SAMPLE DATA (Most Common)
// ============================================================================

/**
 * Sample data factories
 */
export const data = {
	integration: (overrides = {}) => ({
		createdAt: new Date().toISOString(),
		id: 'integration_123',
		providerId: 'provider_123',
		type: 'Clerk',
		updatedAt: new Date().toISOString(),
		userId: 'user_123',
		...overrides,
	}),

	user: (overrides = {}) => ({
		clerkId: 'clerk_user_123',
		createdAt: new Date().toISOString(),
		email: 'test@example.com',
		id: 'user_123',
		updatedAt: new Date().toISOString(),
		...overrides,
	}),

	vendor: (overrides = {}) => ({
		createdAt: new Date().toISOString(),
		description: 'Test Description',
		email: 'vendor@example.com',
		id: 'vendor_123',
		imageUrl: 'https://example.com/image.jpg',
		lat: 40.7128,
		long: -74.006,
		name: 'Test Vendor',
		open: true,
		phone: '123-456-7890',
		updatedAt: new Date().toISOString(),
		website: 'https://example.com',
		...overrides,
	}),
};

// ============================================================================
// ERROR FACTORIES
// ============================================================================

/**
 * Common error factories
 */
export const errors = {
	database: (message = 'Database error') => new Error(message),
	notFound: (message = 'Not found') => new Error(message),
	unauthorized: (message = 'Unauthorized') => new Error(message),
	validation: (message = 'Validation error') => new Error(message),
};

// ============================================================================
// WEBHOOK EVENTS
// ============================================================================

/**
 * Webhook event factories
 */
export const webhooks = {
	clerk: {
		userCreated: (overrides = {}) => ({
			created_at: Date.now(),
			data: {
				email_addresses: [{ email_address: 'test@example.com' }],
				first_name: 'John',
				id: 'clerk_user_123',
				last_name: 'Doe',
				...overrides,
			},
			object: 'event',
			type: 'user.created',
		}),

		userDeleted: (overrides = {}) => ({
			created_at: Date.now(),
			data: {
				id: 'clerk_user_123',
				...overrides,
			},
			object: 'event',
			type: 'user.deleted',
		}),

		userUpdated: (overrides = {}) => ({
			created_at: Date.now(),
			data: {
				email_addresses: [{ email_address: 'test@example.com' }],
				first_name: 'John',
				id: 'clerk_user_123',
				last_name: 'Doe',
				...overrides,
			},
			object: 'event',
			type: 'user.updated',
		}),
	},

	revenueCat: {
		initialPurchase: (overrides = {}) => ({
			event: {
				id: 'event_123',
				product_id: 'premium_monthly',
				subscriber_attributes: {
					clerkUserId: 'clerk_user_123',
				},
				transaction_id: 'txn_456',
				type: 'INITIAL_PURCHASE',
				...overrides,
			},
		}),

		renewal: (overrides = {}) => ({
			event: {
				id: 'event_123',
				product_id: 'premium_monthly',
				subscriber_attributes: {
					clerkUserId: 'clerk_user_123',
				},
				transaction_id: 'txn_456',
				type: 'RENEWAL',
				...overrides,
			},
		}),
	},
};

// ============================================================================
// gRPC HELPERS
// ============================================================================

/**
 * gRPC observable helpers
 */
export const grpc = {
	error: (error: any) => ({
		pipe: vi.fn().mockReturnValue({
			toPromise: vi.fn().mockRejectedValue(error),
		}),
	}),

	observable: (value: any) => ({
		subscribe: vi.fn().mockImplementation((observer) => {
			if (value instanceof Error) {
				observer.error(value);
			} else {
				observer.next(value);
				observer.complete();
			}
			return { unsubscribe: vi.fn() };
		}),
	}),

	success: (value: any) => ({
		pipe: vi.fn().mockReturnValue({
			toPromise: vi.fn().mockResolvedValue(value),
		}),
	}),
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Clear all mocks
 */
export function clearMocks() {
	vi.clearAllMocks();
}

/**
 * Mock retry utility to avoid timeouts in tests
 */
export function mockRetry() {
	return vi.fn().mockImplementation(async (operation: () => Promise<any>) => {
		return await operation();
	});
}

// ============================================================================
// COMMON PATTERNS
// ============================================================================

/**
 * Common test setup for services
 */
export function setupServiceTest(ServiceClass: any, dependencies: Record<string, any> = {}) {
	const service = new ServiceClass(...Object.values(dependencies));
	return { service, ...dependencies };
}

/**
 * Common test setup for controllers
 */
export function setupControllerTest(ControllerClass: any, dependencies: Record<string, any> = {}) {
	const controller = new ControllerClass(...Object.values(dependencies));
	return { controller, ...dependencies };
}
