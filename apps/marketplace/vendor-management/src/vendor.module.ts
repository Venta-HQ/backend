import { APP_NAMES, BootstrapModule, EventsModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
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
	],
	providers: [VendorService],
})
export class VendorModule {}
