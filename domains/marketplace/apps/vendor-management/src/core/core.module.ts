import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, EventService, PrismaModule } from '@venta/nest/modules';
import { LocationModule } from '../location/location.module';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';

@Module({
	imports: [
		PrismaModule.register(),
		LocationModule,
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
	controllers: [CoreController],
	providers: [CoreService, EventService],
	exports: [CoreService],
})
export class CoreModule {}
