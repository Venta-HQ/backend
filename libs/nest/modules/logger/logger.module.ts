import { randomUUID } from 'crypto';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { LokiOptions } from 'pino-loki';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestContextModule, RequestContextService } from '../request-context';
import { GrpcRequestIdInterceptor } from './grpc-logger.interceptor';
import { GrpcLogger } from './grpc-logger.service';
import { Logger } from './logger.service';

export interface LoggerOptions {
	appName: string;
	protocol?: 'http' | 'grpc' | 'auto';
}

@Module({})
export class LoggerModule {
	static register(options: LoggerOptions | string): DynamicModule {
		const appName = typeof options === 'string' ? options : options.appName;
		const protocol = typeof options === 'string' ? 'auto' : options.protocol || 'auto';

		return {
			exports: [
				Logger, // Always export Logger as the unified logger
				...(protocol === 'grpc' || protocol === 'auto' ? [GrpcLogger] : []),
			],
			global: true,
			imports: [
				RequestContextModule,
				PinoLoggerModule.forRootAsync({
					imports: [ConfigModule],
					inject: [ConfigService],
					useFactory: (configService: ConfigService) => {
						const lokiPassword = configService.get('LOKI_PASSWORD');
						const lokiUsername = configService.get('LOKI_USERNAME');
						const lokiUrl = configService.get('LOKI_URL');

						// Validate required environment variables
						if (!lokiPassword || !lokiUsername || !lokiUrl) {
							// In test environment or when LOKI variables are missing, use console transport
							return {
								pinoHttp: {
									base: { app: appName },
									transport: {
										options: {
											colorize: true,
											ignore: 'pid,hostname,time,app,context',
											levelFirst: true,
											messageFormat: `[${appName}] [{context}]: {msg}`,
										},
										target: 'pino-pretty',
									},
								},
							};
						}

						return {
							pinoHttp: {
								base: { app: appName },
								// HTTP-specific request ID handling
								...(protocol === 'http' || protocol === 'auto'
									? {
											customProps: (req: any, _res: any) => {
												const props: any = {};
												if (req.id ?? req.headers?.['x-request-id']) {
													props['requestId'] = req.id ?? req.headers['x-request-id'];
												}
												return props;
											},
											genReqId: (req: any, res: any) => {
												const existingID = req.id ?? req.headers?.['x-request-id'];
												if (existingID) return existingID;
												const id = randomUUID();
												if (res?.setHeader) {
													res.setHeader('x-request-id', id);
												}
												return id;
											},
										}
									: {}),
								transport: {
									targets: [
										{
											options: {
												basicAuth: {
													password: lokiPassword,
													username: lokiUsername,
												},
												batching: true,
												host: lokiUrl,
												interval: 5,
												propsToLabels: ['context', 'app', 'requestId'],
											} satisfies LokiOptions,
											target: 'pino-loki',
										},
										...(process.env['NODE_ENV'] !== 'production'
											? [
													{
														options: {
															colorize: true,
															ignore: 'pid,hostname,time,app,context',
															levelFirst: true,
															messageFormat: `[${appName}] [{context}]: {msg}`,
														},
														target: 'pino-pretty',
													},
												]
											: []),
									],
								},
							},
						};
					},
				}),
			],
			module: LoggerModule,
			providers: [
				// RequestContextService is always needed for gRPC
				RequestContextService,
				// gRPC-specific providers
				...(protocol === 'grpc' || protocol === 'auto'
					? [
							{
								provide: APP_INTERCEPTOR,
								useClass: GrpcRequestIdInterceptor,
							},
							GrpcLogger,
						]
					: []),
				// Always provide Logger as the unified logger
				Logger,
			],
		};
	}
}
