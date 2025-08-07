import { APP_NAMES, BootstrapModule, EventsModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CoreModule } from './core/core.module';
import { LocationModule } from './location/location.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [
				ClientsModule.registerAsync({
					clients: [
						{
							imports: [ConfigModule],
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
			appName: APP_NAMES.VENDOR,
			protocol: 'grpc',
		}),
		EventsModule.register(), // No longer needs appName parameter
		CoreModule,
		LocationModule,
	],
})
export class VendorManagementModule {}
