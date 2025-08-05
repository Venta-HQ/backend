import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { LokiOptions } from 'pino-loki/index';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestContextService } from '../request-context';
import { GrpcRequestIdInterceptor } from './grpc-logger.interceptor';
import { GrpcLogger } from './grpc-logger.service';

@Module({})
export class GrpcLoggerModule {
	static register(appName: string): DynamicModule {
		return {
			exports: [GrpcLogger],
			global: true,
			imports: [
				PinoLoggerModule.forRootAsync({
					imports: [ConfigModule],
					inject: [ConfigService],
					useFactory: (configService: ConfigService) => ({
						pinoHttp: {
							base: { app: appName },
							transport: {
								targets: [
									{
										options: {
											basicAuth: {
												password: configService.get('LOKI_PASSWORD'),
												username: configService.get('LOKI_USERNAME'),
											},
											batching: true,
											// headers: {
											// 	Authorization: configService.get('GRAFANA_SERVICE_ACC_TOKEN')
											// 		? `Bearer ${configService.get('GRAFANA_SERVICE_ACC_TOKEN')}`
											// 		: undefined,
											// },
											host: configService.get('LOKI_URL'),
											interval: 5,
											propsToLabels: ['context', 'app', 'requestId'],
										} satisfies LokiOptions,
										target: 'pino-loki',
									},
									...(configService.get('NODE_ENV') !== 'production'
										? [
												{
													options: {
														colorize: true, // Enable colors in logs
														ignore: 'pid,hostname,time,app,context',
														levelFirst: true,
														messageFormat: `[{app}] [{context}]: {msg}`,
													},
													target: 'pino-pretty', // Use pino-pretty for formatted output
												},
											]
										: []),
								],
							},
						},
					}),
				}),
			],
			module: GrpcLoggerModule,
			providers: [
				RequestContextService,
				{
					provide: APP_INTERCEPTOR,
					useClass: GrpcRequestIdInterceptor,
				},
				GrpcLogger,
			],
		};
	}
}
