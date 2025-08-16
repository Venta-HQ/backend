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

		// Middleware-level logging as a reliable fallback to capture all ORM operations
		this.client.$use(async (params, next) => {
			const start = Date.now();
			try {
				const result = await next(params);
				const durationMs = Date.now() - start;
				this.logger.debug('Prisma operation executed', {
					action: params.action,
					model: params.model,
					operation: `${params.model || 'Raw'}.${params.action}`,
					durationMs,
				});
				return result;
			} catch (err) {
				const durationMs = Date.now() - start;
				this.logger.error('Prisma operation failed', err instanceof Error ? err.stack : undefined, {
					action: params.action,
					model: params.model,
					durationMs,
					error: err instanceof Error ? err.message : String(err),
				});
				throw err;
			}
		});

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
