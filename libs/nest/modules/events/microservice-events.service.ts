import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class MicroserviceEventsService {
	private readonly logger = new Logger(MicroserviceEventsService.name);
	private client: ClientProxy;

	constructor(private readonly configService: ConfigService) {
		this.client = ClientProxyFactory.create({
			transport: Transport.NATS,
			options: {
				servers: this.configService.get('NATS_URL', 'nats://localhost:4222'),
			},
		});
	}

	async onModuleInit() {
		await this.client.connect();
		this.logger.log('Connected to NATS for microservice events');
	}

	async onModuleDestroy() {
		await this.client.close();
	}

	async publishEvent<T>(eventType: string, data: T): Promise<void> {
		try {
			// For microservices, we emit the event directly without the EventMessage wrapper
			// The event type becomes the NATS subject, and the data is sent as-is
			await this.client.emit(eventType, data).toPromise();
			this.logger.log(`Published microservice event: ${eventType}`);
		} catch (error) {
			this.logger.error(`Failed to publish microservice event ${eventType}:`, error);
			throw error;
		}
	}

	async publishVendorEvent<T>(
		type: 'vendor.created' | 'vendor.updated' | 'vendor.deleted' | 'vendor.location.updated',
		data: T,
	): Promise<void> {
		await this.publishEvent(type, data);
	}
}
