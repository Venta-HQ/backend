import { PrismaService } from '@app/database';
import { IEventsService } from '@app/events';
import {
	USER_SERVICE_NAME,
	VendorCreateData,
	VendorCreateResponse,
	VendorUpdateData,
	VendorUpdateResponse,
} from '@app/proto/user';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VendorService {
	constructor(
		private prisma: PrismaService,
		@Inject('EventsService') private eventsService: IEventsService,
	) {}
	private readonly logger = new Logger(VendorService.name);

	async getUserVendors(userId: string) {
		return await this.prisma.db.vendor.findMany({
			select: {
				id: true,
				name: true,
			},
			where: {
				owner: {
					id: userId,
				},
			},
		});
	}
}
