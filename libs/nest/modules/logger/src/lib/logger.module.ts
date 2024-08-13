import { randomUUID } from 'node:crypto';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class LoggerModule {
	static register(
		appName: string
	): DynamicModule {
		return {
			module: LoggerModule,
			global: true,
			imports: [
				PinoLoggerModule.forRootAsync({
					imports: [ConfigModule],
					inject: [ConfigService],
					useFactory: (configService: ConfigService) => ({
						pinoHttp: {
							genReqId: (req, res) => {
								const existingID = req.id ?? req.headers['x-request-id'];
								if (existingID) return existingID;
								const id = randomUUID();
								res.setHeader('x-request-id', id);
								return id;
							},
							transport: {
								options: {
									basicAuth: {
										password: configService.get('LOKI_PASSWORD'),
										username: configService.get('LOKI_USERNAME'),
									},
									batching: true,
									host: configService.get('LOKI_URL'),
									interval: 5,
									labels: {
										app: appName
									}
								},
								target: 'pino-loki',
							}
						},
					}),
				}),
			],
		}
	}
}

