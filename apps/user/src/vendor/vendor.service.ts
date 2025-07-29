import { PrismaService } from '@app/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VendorService {
	constructor(private prisma: PrismaService) {}

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
