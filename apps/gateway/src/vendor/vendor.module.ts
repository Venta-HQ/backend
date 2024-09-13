import { join } from 'path';
import { VENDOR_PACKAGE_NAME, VENDOR_SERVICE_NAME } from '@app/proto/vendor';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VendorController } from './vendor.controller';

@Module({
	controllers: [VendorController],
	imports: [
		ClientsModule.registerAsync({
			clients: [
				{
					imports: [ConfigModule],
					inject: [ConfigService],
					name: VENDOR_SERVICE_NAME,
					useFactory: (configService: ConfigService) => ({
						options: {
							package: VENDOR_PACKAGE_NAME,
							protoPath: join(__dirname, `../proto/src/definitions/vendor.proto`),
							url: configService.get('VENDOR_SERVICE_ADDRESS'),
						},
						transport: Transport.GRPC,
					}),
				},
			],
		}),
	],
	providers: [],
})
export class VendorModule {}
