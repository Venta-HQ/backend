import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventService } from './typed-event.service';

@Module({
	imports: [ConfigModule, ClientsModule.registerAsync([{ name: 'NATS_SERVICE', useFactory: () => ({ transport: Transport.NATS }) }])],
	exports: [EventService],
	providers: [EventService],
})
export class EventsModule {}
