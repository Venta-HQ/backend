import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RequestContextModule } from '../request-context';
import { EventService } from './typed-event.service';

@Module({
	exports: [EventService],
	imports: [
		ConfigModule,
		ClientsModule.registerAsync([{ name: 'NATS_SERVICE', useFactory: () => ({ transport: Transport.NATS }) }]),
		RequestContextModule,
	],
	providers: [EventService],
})
export class EventsModule {}
