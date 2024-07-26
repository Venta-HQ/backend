import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

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
          target: 'pino-loki',
          options: {
            batching: true,
            interval: 5,
            host: process.env.LOKI_URL,
            basicAuth: {
              username: process.env.LOKI_USERNAME,
              password: process.env.LOKI_PASSWORD,
            },
          },
        },
      },
    }),
  ],
})
export class LoggerModule {}
