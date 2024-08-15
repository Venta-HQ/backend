import { AlgoliaService } from '@app/nest/modules/algolia';
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Vendor } from '@prisma/client';
import { PulseCreateEvent, PulseDeleteEvent, PulseUpdateEvent, withPulse } from '@prisma/extension-pulse';
import { AlgoliaIndex } from '../constants';

const pulseType = new PrismaClient().$extends(withPulse({ apiKey: 'any' }));

@Injectable()
export class VendorService implements OnApplicationBootstrap {
	private pulse: typeof pulseType;
	private readonly logger = new Logger(VendorService.name);
	constructor(
		@Inject('PRISMA') private prisma: PrismaClient,
		private configService: ConfigService,
		private readonly algoliaService: AlgoliaService,
	) {
		this.pulse = this.prisma.$extends(
			withPulse({
				apiKey: this.configService.get('PULSE_API_KEY'),
			}),
		);
	}

	async onApplicationBootstrap() {
		await this.setupListeners();
	}

	private async setupListeners() {
		this.logger.log('Initializing vendor dbchange stream');
		const stream = await this.pulse.vendor.stream();

		for await (const event of stream) {
			this.logger.log(`[VENDOR DBCHANGE EVENT] ${event.action}`);
			switch (event.action) {
				case 'create':
					await this.handleCreate(event);
					break;
				case 'delete':
					await this.handleDelete(event);
					break;
				case 'update':
					await this.handleUpdate(event);
					break;
			}
		}
	}

	async handleCreate(data: PulseCreateEvent<Vendor>) {
		await this.algoliaService.createObject(AlgoliaIndex.VENDOR, data.created);
	}

	async handleDelete(data: PulseDeleteEvent<Vendor>) {
		await this.algoliaService.deleteObject(AlgoliaIndex.VENDOR, data.deleted.id);
	}

	async handleUpdate(data: PulseUpdateEvent<Vendor>) {
		await this.algoliaService.updateObject(AlgoliaIndex.VENDOR, data.after.id, data.after);
	}
}
