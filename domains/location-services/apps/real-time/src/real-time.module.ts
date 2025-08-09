import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BootstrapModule, EventService, PrismaModule, RedisModule } from '@venta/nest/modules';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'real-time',
			domain: 'location-services',
			protocol: 'websocket',
		}),
		ConfigModule,
		PrismaModule,
		RedisModule,
		CoreModule,
	],
	providers: [EventService],
})
export class RealTimeModule {}
