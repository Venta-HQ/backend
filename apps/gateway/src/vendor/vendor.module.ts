import { join } from 'path';
import { ClerkModule } from 'libs/nest/modules';
import { VENDOR_PACKAGE_NAME, VENDOR_SERVICE_NAME } from '@app/proto/vendor';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VendorController } from './vendor.controller';

@Module({
	controllers: [VendorController],
	imports: [
		ClerkModule.register(),
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
})
export class VendorModule {}
