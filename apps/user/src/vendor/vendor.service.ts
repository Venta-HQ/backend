import { IEventsService, PrismaService } from '@app/nest/modules';
import { Inject, Injectable, Logger } from '@nestjs/common';

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
