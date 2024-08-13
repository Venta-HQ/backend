import { Module } from '@nestjs/common';
import { LoggerModule } from '@app/nest/modules/logger';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot(),
		LoggerModule.register('Location Microservice'),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
