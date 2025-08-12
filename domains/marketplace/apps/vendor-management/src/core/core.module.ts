import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GrpcAuthInterceptor } from '@venta/nest/interceptors';
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
	providers: [
		CoreService,
		EventService,
		{
			provide: APP_INTERCEPTOR,
			useClass: GrpcAuthInterceptor,
		},
	],
	exports: [CoreService],
})
export class CoreModule {}
