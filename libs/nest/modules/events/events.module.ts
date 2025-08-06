import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RequestContextModule } from '../request-context';
import { EventService } from './typed-event.service';

export interface EventsModuleOptions {
	serviceName: string;
}

@Module({})
export class EventsModule {
	static register(options: EventsModuleOptions): DynamicModule {
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
				{
					provide: 'EVENTS_OPTIONS',
					useValue: options,
				},
			],
		};
	}
}
