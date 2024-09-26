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
		...data: T[K] extends (...args: any[]) => any ? Parameters<T[K]> : never
	): T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : never {
		const metadata = {
			traceId: this.request.id,
		};

		// Adds our custom metadata
		data[1] = { ...data[1], ...metadata };

		if (this.service[method]) {
			return (this.service[method] as (...args: any[]) => any)(...data);
		}
	}
}

export default GrpcInstance;
