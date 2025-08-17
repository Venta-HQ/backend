import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Logger } from '../../core/logger';

const getClient = (url: string) => {
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

	constructor(
		connectionString: string,
		_pulseKey: string,
		private readonly logger: Logger,
	) {
		this.logger.setContext(PrismaService.name);
		this.client = getClient(connectionString);

		// Use a Prisma extension to reliably capture ALS requestId at the callsite
		const logExtension = Prisma.defineExtension({
			query: {
				$allModels: {
					$allOperations: async ({ model, operation, args, query }) => {
						const start = Date.now();
						try {
							const result = await query(args);
							this.logger.log('Prisma query executed', {
								model,
								action: operation,
								params: args,
								durationMs: Date.now() - start,
							});
							return result;
						} catch (err) {
							this.logger.error('Prisma query error', err instanceof Error ? err.stack : undefined, {
								model,
								action: operation,
								params: args,
								message: err instanceof Error ? err.message : String(err),
							});
							throw err;
						}
					},
				},
			},
		});

		this.client = (this.client as PrismaClient).$extends(logExtension) as unknown as PrismaClient;
	}

	get db() {
		return this.client;
	}

	/**
	 * Extract SQL operation type for searchable attributes
	 */
	private extractSqlOperationType(query: string): string {
		const trimmed = query.trim().toUpperCase();

		if (trimmed.startsWith('SELECT')) return 'SELECT';
		if (trimmed.startsWith('INSERT')) return 'INSERT';
		if (trimmed.startsWith('UPDATE')) return 'UPDATE';
		if (trimmed.startsWith('DELETE')) return 'DELETE';
		if (trimmed.startsWith('CREATE')) return 'CREATE';
		if (trimmed.startsWith('DROP')) return 'DROP';
		if (trimmed.startsWith('ALTER')) return 'ALTER';
		if (trimmed.startsWith('WITH')) return 'WITH'; // CTE queries

		return 'OTHER';
	}

	async onModuleInit() {
		await this.client.$connect();
	}

	async onModuleDestroy() {
		await this.client.$disconnect();
	}
}
