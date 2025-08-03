import { RetryUtil } from '@app/utils';
import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
class GrpcInstance<T> {
	private readonly retryUtil: RetryUtil;
	private readonly logger = new Logger(GrpcInstance.name);

	constructor(
		@Inject(REQUEST) private readonly request: any,
		private readonly service: T,
	) {
		this.retryUtil = new RetryUtil({
			logger: this.logger,
			maxRetries: 3,
			retryDelay: 1000,
		});
	}

	invoke<K extends keyof T>(
		method: K,
		data: T[K] extends (...args: any[]) => any ? Parameters<T[K]>[0] : never,
	): T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never {
		return this.retryUtil.retryOperation(
			async () => {
				const metadata = new Metadata();

				if (this.request.id) {
					metadata.set('requestId', this.request.id);
				}

				// Adds our custom metadata
				if (this.service[method]) {
					return (this.service[method] as (...args: any[]) => any)(data, metadata);
				}

				// This should never happen if the method exists, but TypeScript requires a return
				throw new Error(`Method ${String(method)} not found on service`);
			},
			`gRPC call to ${String(method)}`,
		) as T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never;
	}
}

export default GrpcInstance;
