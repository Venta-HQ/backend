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
}
