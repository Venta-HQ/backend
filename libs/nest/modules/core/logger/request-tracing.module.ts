import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
	GrpcRequestIdInterceptor,
	HttpRequestIdInterceptor,
	NatsRequestIdInterceptor,
	WsRequestIdInterceptor,
} from '../../../interceptors/request-id';
import { RequestContextModule } from '../../networking/request-context';
import { LoggerModule } from './logger.module';

export interface RequestTracingOptions {
	protocol: 'http' | 'grpc' | 'websocket' | 'nats';
}

@Module({})
export class RequestTracingModule {
	static register(options: RequestTracingOptions): DynamicModule {
		const providers = [];

		// Add protocol-specific interceptors
		if (options.protocol === 'http') {
			providers.push({
				provide: APP_INTERCEPTOR,
				useClass: HttpRequestIdInterceptor,
			});
		} else if (options.protocol === 'grpc') {
			providers.push({
				provide: APP_INTERCEPTOR,
				useClass: GrpcRequestIdInterceptor,
			});
		} else if (options.protocol === 'nats') {
			providers.push({
				provide: APP_INTERCEPTOR,
				useClass: NatsRequestIdInterceptor,
			});
		} else if (options.protocol === 'websocket') {
			providers.push({
				provide: APP_INTERCEPTOR,
				useClass: WsRequestIdInterceptor,
			});
		}

		return {
			imports: [RequestContextModule, LoggerModule.register()],
			module: RequestTracingModule,
			providers,
		};
	}
}
