import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withPulse } from '@prisma/extension-pulse';
import { Logger } from '@venta/nest/modules';

const getExtendedClientType = (client: PrismaClient, apiKey: string) => {
	return client.$extends(withPulse({ apiKey }));
};
type ExtendedPrismaClient = ReturnType<typeof getExtendedClientType>;

const getClient = (url) => {
	return new PrismaClient({
		datasources: {
			db: {
				url,
			},
		},
		log: [
			{ emit: 'event', level: 'query' },
			{ emit: 'event', level: 'error' },
		],
	});
};
type CustomPrismaClient = ReturnType<typeof getClient>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
	private client: CustomPrismaClient;
	private pulseClient: ExtendedPrismaClient;

	constructor(
		connectionString: string,
		pulseKey: string,
		private readonly logger: Logger,
	) {
		this.logger.setContext(PrismaService.name);
		this.client = getClient(connectionString);

		this.client.$on('error', (e) => {
			this.logger.error('Database error occurred', undefined, { error: e });
		});

		this.client.$on('query', (e) => {
			this.logger.log('Database query executed', {
				duration: e.duration,
				params: e.params,
				query: e.query,
			});
		});

		this.pulseClient = getExtendedClientType(this.client, pulseKey);
	}

	get db() {
		return this.client;
	}

	get pulse() {
		return this.pulseClient;
	}

	async onModuleInit() {
		await this.client.$connect();
	}

	async onModuleDestroy() {
		await this.client.$disconnect();
	}
}
