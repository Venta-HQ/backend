import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Observable, retry, timer } from 'rxjs';

@Injectable({ scope: Scope.REQUEST })
class GrpcInstance<T> {
	private readonly logger = new Logger(GrpcInstance.name);
	constructor(
		@Inject(REQUEST) private readonly request: any,
		private readonly service: T,
	) {}

	invoke<K extends keyof T>(
		method: K,
		data: T[K] extends (...args: any[]) => any ? Parameters<T[K]>[0] : never,
	): T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never {
		const metadata = new Metadata();

		if (this.request.id) {
			metadata.set('requestId', this.request.id);
		}

		// Adds our custom metadata
		if (this.service[method]) {
			const result = (this.service[method] as (...args: any[]) => any)(data, metadata);
			
			// If the result is an Observable, add retry logic
			if (result && typeof result.pipe === 'function') {
				return result.pipe(
					retry({
						count: 3,
						delay: (error, retryCount) => {
							this.logger.warn(`gRPC call to ${String(method)} failed (attempt ${retryCount}):`, error);
							return timer(1000 * Math.pow(2, retryCount - 1)); // Exponential backoff
						},
					})
				) as T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never;
			}
			
			return result;
		}

		// This should never happen if the method exists, but TypeScript requires a return
		throw new Error(`Method ${String(method)} not found on service`);
	}
}

export default GrpcInstance;
