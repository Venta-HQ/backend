import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: 'localhost:5000',
        package: 'auth',
        protoPath: join(__dirname,`../proto/src/definitions/auth.proto`),
      },
    }
  );

  await app.listen();

  app.useLogger(app.get(Logger));
}

bootstrap();
