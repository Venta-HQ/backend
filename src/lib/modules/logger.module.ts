import { randomUUID } from 'node:crypto';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { Module } from '@nestjs/common';

@Module({
	imports: [
		PinoLoggerModule.forRoot({
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
							password: process.env.LOKI_PASSWORD,
							username: process.env.LOKI_USERNAME,
						},
						batching: true,
						host: process.env.LOKI_URL,
						interval: 5,
					},
					target: 'pino-loki',
				},
			},
		}),
	],
})
export class LoggerModule {}
