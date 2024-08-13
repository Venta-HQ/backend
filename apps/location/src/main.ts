import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,  {
    transport: Transport.GRPC,
    options: {
      url: 'localhost:5001',
      package: 'auth',
      protoPath: join(__dirname,`../proto/src/definitions/location.proto`),
    },
  });

  await app.listen();

  app.useLogger(app.get(Logger));
}

bootstrap();
