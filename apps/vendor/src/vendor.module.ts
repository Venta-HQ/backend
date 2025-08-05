import { BootstrapModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	imports: [
		BootstrapModule.forRoot({
			appName: 'Vendor Microservice',
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
	providers: [VendorService],
})
export class VendorModule {}
