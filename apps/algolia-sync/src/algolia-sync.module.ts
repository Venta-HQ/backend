import { AlgoliaModule, NatsQueueModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AlgoliaSyncController } from './algolia-sync.controller';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	controllers: [AlgoliaSyncController],
	imports: [
		AlgoliaModule.register(),
		NatsQueueModule,
		ClientsModule.registerAsync({
			clients: [
				{
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
	providers: [AlgoliaSyncService],
})
export class AlgoliaSyncModule {}
