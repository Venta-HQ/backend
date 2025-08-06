import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GrpcRequestIdInterceptor, NatsRequestIdInterceptor } from '../../../interceptors/request-id';

export interface RequestTracingOptions {
	protocol: 'http' | 'grpc' | 'websocket' | 'nats';
}

@Module({})
export class RequestTracingModule {
	static register(options: RequestTracingOptions): DynamicModule {
		const providers = [];

		// Add protocol-specific interceptors
		if (options.protocol === 'grpc') {
			providers.push({
				provide: APP_INTERCEPTOR,
				useClass: GrpcRequestIdInterceptor,
			});
		} else if (options.protocol === 'nats') {
			providers.push({
				provide: APP_INTERCEPTOR,
				useClass: NatsRequestIdInterceptor,
			});
		}
		// HTTP services use Pino for automatic request ID handling, so no interceptor needed

		return {
			module: RequestTracingModule,
			providers,
		};
	}
}
