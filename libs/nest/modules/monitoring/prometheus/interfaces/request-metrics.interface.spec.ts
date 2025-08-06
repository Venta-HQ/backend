import { RequestMetrics } from './request-metrics.interface';

describe('RequestMetrics Interface', () => {
	// Mock implementation for testing
	class MockRequestMetrics implements RequestMetrics {
		constructor(
			private method: string,
			private route: string,
			private requestSize: number,
			private responseSize: number,
			private duration: number,
			private statusCode: number,
			private protocol: string,
		) {}

		getMethod(): string {
			return this.method;
		}

		getRoute(): string {
			return this.route;
		}

		getRequestSize(): number {
			return this.requestSize;
		}

		getResponseSize(): number {
			return this.responseSize;
		}

		getDuration(): number {
			return this.duration;
		}

		getStatusCode(): number {
			return this.statusCode;
		}

		getProtocol(): string {
			return this.protocol;
		}
	}

	describe('HTTP Request Metrics', () => {
		let httpMetrics: RequestMetrics;

		beforeEach(() => {
			httpMetrics = new MockRequestMetrics('GET', '/api/users', 1024, 2048, 150, 200, 'http');
		});

		it('should return correct HTTP method', () => {
			expect(httpMetrics.getMethod()).toBe('GET');
		});

		it('should return correct HTTP route', () => {
			expect(httpMetrics.getRoute()).toBe('/api/users');
		});

		it('should return correct request size', () => {
			expect(httpMetrics.getRequestSize()).toBe(1024);
		});

		it('should return correct response size', () => {
			expect(httpMetrics.getResponseSize()).toBe(2048);
		});

		it('should return correct duration', () => {
			expect(httpMetrics.getDuration()).toBe(150);
		});

		it('should return correct status code', () => {
			expect(httpMetrics.getStatusCode()).toBe(200);
		});

		it('should return correct protocol', () => {
			expect(httpMetrics.getProtocol()).toBe('http');
		});
	});

	describe('gRPC Request Metrics', () => {
		let grpcMetrics: RequestMetrics;

		beforeEach(() => {
			grpcMetrics = new MockRequestMetrics('getUserById', 'grpc', 0, 512, 75, 200, 'grpc');
		});

		it('should return correct gRPC method', () => {
			expect(grpcMetrics.getMethod()).toBe('getUserById');
		});

		it('should return correct gRPC route', () => {
			expect(grpcMetrics.getRoute()).toBe('grpc');
		});

		it('should return zero request size for gRPC', () => {
			expect(grpcMetrics.getRequestSize()).toBe(0);
		});

		it('should return correct response size', () => {
			expect(grpcMetrics.getResponseSize()).toBe(512);
		});

		it('should return correct duration', () => {
			expect(grpcMetrics.getDuration()).toBe(75);
		});

		it('should return correct status code', () => {
			expect(grpcMetrics.getStatusCode()).toBe(200);
		});

		it('should return correct protocol', () => {
			expect(grpcMetrics.getProtocol()).toBe('grpc');
		});
	});
});
