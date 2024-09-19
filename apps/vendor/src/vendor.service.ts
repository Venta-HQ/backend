import { VendorCreateData } from '@app/proto/vendor';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class VendorService {
	constructor(@Inject('PRISMA') private prisma: PrismaClient) {}
	private readonly logger = new Logger(VendorService.name);

	async getVendorById(id: string) {
		const vendor = await this.prisma.vendor.findFirst({
			where: { id },
		});
		return vendor;
	}

	async createVendor(data: VendorCreateData) {
		this.logger.log('Creating new vendor');
		const vendor = await this.prisma.vendor.create({
			data: {
				...data,
				owner: {
					connect: {
						clerkId: data.userId,
					},
				},
			},
		});

		return vendor.id;
	}
}
