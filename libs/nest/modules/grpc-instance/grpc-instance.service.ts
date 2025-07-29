import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
class GrpcInstance<T> {
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

		// This should never happen if the method exists, but TypeScript requires a return
		throw new Error(`Method ${String(method)} not found on service`);
	}
}

export default GrpcInstance;
