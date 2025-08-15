import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppExceptionFilter, GrpcExceptionFilter } from '@venta/nest/filters';

@Module({})
export class ErrorHandlingModule {
	static forProtocol(protocol: 'http' | 'grpc' | 'websocket' | 'nats' = 'http'): DynamicModule {
		const providers = [];

		// Apply the appropriate exception filter based on protocol
		if (protocol === 'grpc') {
			providers.push({
				provide: APP_FILTER,
				useClass: GrpcExceptionFilter,
			});
		} else {
			// HTTP, WebSocket, NATS use the generic AppExceptionFilter
			providers.push({
				provide: APP_FILTER,
				useClass: AppExceptionFilter,
			});
		}

		return {
			module: ErrorHandlingModule,
			imports: [ConfigModule],
			providers,
			exports: [],
		};
	}

	// Backward compatibility - defaults to HTTP
	static forRoot(): DynamicModule {
		return this.forProtocol('http');
	}
}
