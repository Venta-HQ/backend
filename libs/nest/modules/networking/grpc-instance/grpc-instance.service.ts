import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthenticatedRequest } from '@venta/nest/guards';
import { retryObservable } from '@venta/utils';

@Injectable({ scope: Scope.REQUEST })
class GrpcInstance<T> {
	private readonly logger = new Logger(GrpcInstance.name);
	constructor(
		@Inject(REQUEST) private readonly request: Request,
		private readonly service: T,
	) {}

	invoke<K extends keyof T>(
		method: K,
		data: T[K] extends (...args: any[]) => any ? Parameters<T[K]>[0] : never,
	): T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never {
		const metadata = new Metadata();

		if ((this.request as any).user?.id) {
			metadata.set('x-request-id', (this.request as any).user.id);
		}

		if ((this.request as any).user?.clerkId) {
			metadata.set('x-clerk-id', (this.request as any).user.clerkId);
		}

		// Log the gRPC request being made
		this.logger.log(`Making gRPC request to ${String(method)}`, { requestId: (this.request as any).user?.id });

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
