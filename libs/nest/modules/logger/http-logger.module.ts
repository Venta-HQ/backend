import { randomUUID } from 'node:crypto';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { LokiOptions } from 'pino-loki/index';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class HttpLoggerModule {
	static register(appName: string): DynamicModule {
		return {
			global: true,
			imports: [
				PinoLoggerModule.forRootAsync({
					imports: [ConfigModule],
					inject: [ConfigService],
					useFactory: (configService: ConfigService) => ({
						pinoHttp: {
							base: { app: appName },
							customProps: (req, _res) => {
								const props = {};
								if (req.id ?? req.headers['x-request-id']) {
									props['requestId'] = req.id ?? req.headers['x-request-id'];
								}
								return props;
							},
							genReqId: (req, res) => {
								const existingID = req.id ?? req.headers['x-request-id'];
								if (existingID) return existingID;
								const id = randomUUID();
								res.setHeader('x-request-id', id);
								return id;
							},
							transport: {
								targets: [
									{
										options: {
											basicAuth: {
												password: configService.get('LOKI_PASSWORD'),
												username: configService.get('LOKI_USERNAME'),
											},
											batching: true,
											headers: {
												Authorization: configService.get('GRAFANA_SERVICE_ACC_TOKEN') ?? null,
											},
											host: configService.get('LOKI_URL'),
											interval: 5,
											propsToLabels: ['context', 'app', 'requestId'],
										} satisfies LokiOptions,
										target: 'pino-loki',
									},
									...(process.env.NODE_ENV !== 'production'
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
			module: HttpLoggerModule,
		};
	}
}
