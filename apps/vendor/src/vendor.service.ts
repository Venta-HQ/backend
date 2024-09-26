import { PrismaService } from '@app/nest/modules';
import { VendorCreateData, VendorUpdateData } from '@app/proto/vendor';
import { status } from '@grpc/grpc-js';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

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
		const { imageUrl, userId, ...rest } = data;
		const vendor = await this.prisma.db.vendor.create({
			data: {
				...rest,
				owner: {
					connect: {
						id: userId,
					},
				},
				primaryImage: imageUrl,
			},
		});

		return vendor.id;
	}

	async updateVendor(id: string, userId: string, data: Omit<VendorUpdateData, 'id' | 'userId'>) {
		const exists = await this.prisma.db.vendor.count({
			where: { id, owner: { id: userId } },
		});

		if (!exists) {
			throw new RpcException({
				code: status.NOT_FOUND,
				message: `Vendor with ID ${id} not found or does not belong to user ${userId}`,
			});
		}

		const { imageUrl, ...updateData } = data;

		await this.prisma.db.vendor.update({
			data: {
				...updateData,
				...(imageUrl
					? {
							primaryImage: imageUrl,
						}
					: {}),
			},
			where: { id, owner: { id: userId } },
		});
	}
}
