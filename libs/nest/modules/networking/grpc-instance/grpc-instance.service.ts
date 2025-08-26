import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Metadata } from '@grpc/grpc-js';
import { Injectable, Optional } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { context, propagation, trace } from '@opentelemetry/api';
import { retryObservable, shouldRetryGrpcCode } from '@venta/utils';
import { Logger } from '../../core/logger';
import { RequestContextService } from '../request-context';

/**
 * Singleton gRPC service that uses RequestContextService for context.
 * Compatible with WebSocket gateways and other singleton services.
 *
 * This service automatically picks up user context from RequestContextService
 * when available, making it work seamlessly in both HTTP and WebSocket contexts.
 */
@Injectable()
export class GrpcInstance<T> {
	private readonly service: T;

	constructor(
		private readonly client: ClientGrpc,
		private readonly serviceName: string,
		private readonly logger: Logger,
		@Optional() private readonly requestContextService?: RequestContextService,
	) {
		this.logger.setContext(`GrpcInstance-${serviceName}`);
		this.service = this.client.getService<T>(serviceName);
	}

	/**
	 * Invoke a gRPC method with automatic context propagation from RequestContextService
	 */
	invoke<K extends keyof T>(
		method: K,
		data: T[K] extends (...args: any[]) => any ? Parameters<T[K]>[0] : never,
		contextOverride?: { userId?: string; clerkId?: string; requestId?: string },
	): T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never {
		const metadata = new Metadata();

		// Get context from RequestContextService or override
		const userId = contextOverride?.userId || this.requestContextService?.getUserId();
		const clerkId = contextOverride?.clerkId || this.requestContextService?.getClerkId();
		const requestId = contextOverride?.requestId || this.requestContextService?.getRequestId();

		// CRITICAL: Manually inject OpenTelemetry trace context for cross-service linking
		try {
			const carrier: Record<string, string> = {};
			propagation.inject(context.active(), carrier);

			// Add OpenTelemetry context to gRPC metadata
			Object.entries(carrier).forEach(([key, value]) => {
				if (value) {
					metadata.set(key, value);
				}
			});
		} catch (error) {
			// Log but don't fail the gRPC call if context propagation fails
			this.logger.warn('Failed to inject trace context into gRPC metadata', { error: error.message });
		}

		// Add authentication metadata if user exists
		if (userId) {
			metadata.set('x-user-id', userId);
		}
		if (clerkId) {
			metadata.set('x-clerk-id', clerkId);
		}
		if (requestId) {
			metadata.set('x-request-id', requestId);
		}

		// Log the gRPC request being made
		this.logger.debug('Making gRPC request', {
			userId,
			clerkId,
			requestId,
			method: String(method),
			serviceName: this.serviceName,
		});

		// Create manual gRPC client span since automatic instrumentation doesn't work with NestJS ClientGrpc
		const tracer = trace.getTracer('grpc-instance');
		const span = tracer.startSpan(`grpc.client.${String(method)}`, {
			kind: 2, // SPAN_KIND_CLIENT
			attributes: {
				'rpc.system': 'grpc',
				'rpc.method': String(method),
				'rpc.service': this.serviceName,
				'user.id': userId || 'anonymous',
			},
		});

		return context.with(trace.setSpan(context.active(), span), () => {
			try {
				const result = (this.service[method] as (...args: any[]) => any)(data, metadata);

				// If the result is an Observable, add retry logic and span completion
				if (result && typeof result.pipe === 'function') {
					return retryObservable(result, `gRPC call to ${String(method)}`, {
						logger: this.logger,
						retryCondition: (error: any) =>
							shouldRetryGrpcCode(typeof error?.code === 'number' ? error.code : undefined),
					}).pipe(
						tap(() => {
							// Success - mark span as OK and end it
							span.setStatus({ code: 1 }); // OK
							span.end();
						}),
						catchError((error: any) => {
							// Error - record exception and end span
							span.recordException(error);
							span.setStatus({ code: 2, message: error.message }); // ERROR
							span.end();
							return throwError(() => error);
						}),
					) as T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never;
				}

				// For non-Observable results, end span immediately
				span.setStatus({ code: 1 }); // OK
				span.end();
				return result;
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: 2, message: (error as Error).message });
				span.end();
				throw error;
			}
		});
	}

	/**
	 * Invoke a gRPC method within a specific user context.
	 * Useful for WebSocket operations where you want to ensure proper context.
	 */
	invokeWithUser<K extends keyof T>(
		user: { id: string; clerkId: string },
		method: K,
		data: T[K] extends (...args: any[]) => any ? Parameters<T[K]>[0] : never,
		requestId?: string,
	): T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never {
		if (!this.requestContextService) {
			// Fallback to direct invocation with context override
			return this.invoke(method, data, {
				userId: user.id,
				clerkId: user.clerkId,
				requestId,
			});
		}

		// Run within user context for proper AsyncLocalStorage handling
		return this.requestContextService.runWithUser(
			user,
			() => {
				return this.invoke(method, data, { requestId });
			},
			requestId,
		);
	}
}
