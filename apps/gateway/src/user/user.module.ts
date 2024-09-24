import { join } from 'path';
import { ClerkModule } from 'libs/nest/modules';
import { USER_PACKAGE_NAME, USER_SERVICE_NAME } from '@app/proto/user';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user.controller';

@Module({
	controllers: [UserController],
	imports: [
		ClerkModule.register(),
		ClientsModule.registerAsync({
			clients: [
				{
					imports: [ConfigModule],
					inject: [ConfigService],
					name: USER_SERVICE_NAME,
					useFactory: (configService: ConfigService) => ({
						options: {
							package: USER_PACKAGE_NAME,
							protoPath: join(__dirname, `../proto/src/definitions/user.proto`),
							url: configService.get('USER_SERVICE_ADDRESS'),
						},
						transport: Transport.GRPC,
					}),
				},
			],
		}),
	],
})
export class UserModule {}
