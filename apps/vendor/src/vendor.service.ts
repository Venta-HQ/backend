import { PrismaService } from '@app/nest/modules';
import { VendorCreateData } from '@app/proto/vendor';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VendorService {
	constructor(private prisma: PrismaService) {}
	private readonly logger = new Logger(VendorService.name);

	async getVendorById(id: string) {
		const vendor = await this.prisma.db.vendor.findFirst({
			where: { id },
		});
		return vendor;
	}

	async createVendor(data: VendorCreateData) {
		this.logger.log('Creating new vendor');
		const { userId, ...rest } = data;
		const vendor = await this.prisma.db.vendor.create({
			data: {
				...rest,
				owner: {
					connect: {
						id: userId,
					},
				},
			},
		});

		return vendor.id;
	}
}
