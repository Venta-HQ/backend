import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { HttpRequest } from '@venta/apitypes';
import { retryObservable } from '@venta/utils';

@Injectable({ scope: Scope.REQUEST })
class GrpcInstance<T> {
	private readonly logger = new Logger(GrpcInstance.name);
	constructor(
		@Inject(REQUEST) private readonly request: HttpRequest,
		private readonly service: T,
	) {}

	invoke<K extends keyof T>(
		method: K,
		data: T[K] extends (...args: any[]) => any ? Parameters<T[K]>[0] : never,
	): T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never {
		const metadata = new Metadata();

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
			const result = (this.service[method] as (...args: any[]) => any)(data, metadata);

			// If the result is an Observable, add retry logic using shared utility
			if (result && typeof result.pipe === 'function') {
				return retryObservable(result, `gRPC call to ${String(method)}`, { logger: this.logger }) as T[K] extends (
					...args: any[]
				) => any
					? ReturnType<T[K]>
					: never;
			}

			return result;
		}

		// This should never happen if the method exists, but TypeScript requires a return
		throw new Error(`Method ${String(method)} not found on service`);
	}
}

export default GrpcInstance;
