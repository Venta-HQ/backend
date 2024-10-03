import { AlgoliaService, PrismaService } from '@app/nest/modules';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Vendor } from '@prisma/client';
import { PulseCreateEvent, PulseDeleteEvent, PulseUpdateEvent } from '@prisma/extension-pulse';
import { AlgoliaIndex } from '../constants';

@Injectable()
export class VendorService implements OnModuleInit {
	private readonly logger = new Logger(VendorService.name);
	constructor(
		private prisma: PrismaService,
		private readonly algoliaService: AlgoliaService,
	) {}

	async onModuleInit() {
		setTimeout(() => {
			this.setupListeners();
		}, 4000);
	}

	private async setupListeners() {
		this.logger.log('Initializing vendor dbchange stream');
		const stream = await this.prisma.pulse.vendor.stream();

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
		await this.algoliaService.createObject(AlgoliaIndex.VENDOR, {
			...data.created,
			...(data.created.lat && data.created.long
				? {
						_geoloc: {
							lat: data.created.lat,
							lng: data.created.long,
						},
					}
				: {}),
		});
	}

	async handleDelete(data: PulseDeleteEvent<Vendor>) {
		await this.algoliaService.deleteObject(AlgoliaIndex.VENDOR, data.deleted.id);
	}

	async handleUpdate(data: PulseUpdateEvent<Vendor>) {
		await this.algoliaService.updateObject(AlgoliaIndex.VENDOR, data.after.id, {
			...data.after,
			...(data.after.lat && data.after.long
				? {
						_geoloc: {
							lat: data.after.lat,
							lng: data.after.long,
						},
					}
				: {}),
		});
	}
}
