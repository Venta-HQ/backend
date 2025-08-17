import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { context, propagation, trace } from '@opentelemetry/api';
import { HttpRequest } from '@venta/apitypes';
import { Logger } from '@venta/nest/modules';
import { retryObservable, shouldRetryGrpcCode } from '@venta/utils';

@Injectable({ scope: Scope.REQUEST })
class GrpcInstance<T> {
	constructor(
		@Inject(REQUEST) private readonly request: HttpRequest,
		private readonly service: T,
		private readonly logger: Logger,
	) {
		this.logger.setContext(GrpcInstance.name);
	}

	invoke<K extends keyof T>(
		method: K,
		data: T[K] extends (...args: any[]) => any ? Parameters<T[K]>[0] : never,
	): T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never {
		const metadata = new Metadata();

		// CRITICAL: Manually inject OpenTelemetry trace context for cross-service linking
		// The automatic gRPC instrumentation doesn't work well with NestJS's ClientGrpc wrapper
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

		// Add authentication metadata if user exists (optional for public endpoints)
		if (this.request.user?.id) {
			metadata.set('x-user-id', this.request.user.id);
			metadata.set('x-clerk-id', this.request.user.clerkId);
		}

		if (this.request.requestId) {
			metadata.set('x-request-id', this.request.requestId);
		}

		// Log the gRPC request being made
		this.logger.log(`Making gRPC request to ${String(method)}`, {
			userId: this.request.user?.id,
			method: String(method),
		});

		// Adds our custom metadata
		if (this.service[method]) {
			// Create manual gRPC client span since automatic instrumentation doesn't work with NestJS ClientGrpc
			const tracer = trace.getTracer('grpc-instance');
			const span = tracer.startSpan(`grpc.client.${String(method)}`, {
				kind: 2, // SPAN_KIND_CLIENT
				attributes: {
					'rpc.system': 'grpc',
					'rpc.method': String(method),
					'rpc.service': 'grpc-service',
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

		// This should never happen if the method exists, but TypeScript requires a return
		throw new Error(`Method ${String(method)} not found on service`);
	}
}

export default GrpcInstance;
