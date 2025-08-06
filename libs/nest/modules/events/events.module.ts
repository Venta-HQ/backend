import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RequestContextModule } from '../request-context';
import { EventService } from './typed-event.service';

@Module({})
export class EventsModule {
	static register(): DynamicModule {
		return {
			exports: [EventService],
			imports: [
				ConfigModule,
				ClientsModule.registerAsync([{ name: 'NATS_SERVICE', useFactory: () => ({ transport: Transport.NATS }) }]),
				RequestContextModule,
			],
			module: EventsModule,
			providers: [
				EventService,
				ConfigService, // Make ConfigService available to EventService
			],
		};
	}
}
