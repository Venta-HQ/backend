import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NatsEventsService } from './nats-events.service';

@Module({
	exports: ['EventsService'],
	imports: [ConfigModule],
	providers: [{ provide: 'EventsService', useClass: NatsEventsService }],
})
export class EventsModule {} 