import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceEventsService } from './microservice-events.service';
import { NatsEventsService } from './nats-events.service';

@Module({
	exports: ['EventsService', MicroserviceEventsService],
	imports: [ConfigModule],
	providers: [{ provide: 'EventsService', useClass: NatsEventsService }, MicroserviceEventsService],
})
export class EventsModule {}
