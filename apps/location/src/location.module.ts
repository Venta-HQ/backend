import { BootstrapModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
	controllers: [LocationController],
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [RedisModule],
			appName: 'Location Microservice',
			protocol: 'grpc',
		}),
		ClientsModule.registerAsync({
			clients: [
				{
					inject: [ConfigService],
					name: 'NATS_SERVICE',
					useFactory: (configService: ConfigService) => ({
						options: {
							servers: configService.get('NATS_URL') || 'nats://localhost:4222',
						},
						transport: Transport.NATS,
					}),
				},
			],
		}),
	],
	providers: [LocationService],
})
export class LocationModule {}
