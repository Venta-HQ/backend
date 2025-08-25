import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppExceptionFilter, GrpcExceptionFilter } from '@venta/nest/filters';
import { Logger, LoggerModule } from '@venta/nest/modules';

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
				useFactory: (configService: ConfigService, logger: Logger) => new AppExceptionFilter(configService, logger),
				inject: [ConfigService, Logger],
			});
		}

		return {
			module: ErrorHandlingModule,
			imports: [ConfigModule, LoggerModule.register()],
			providers,
			exports: [],
		};
	}

	// Backward compatibility - defaults to HTTP
	static forRoot(): DynamicModule {
		return this.forProtocol('http');
	}
}
