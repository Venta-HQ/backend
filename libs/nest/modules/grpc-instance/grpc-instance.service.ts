import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

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
			return (this.service[method] as (...args: any[]) => any)(data, metadata);
		}
	}
}

export default GrpcInstance;
