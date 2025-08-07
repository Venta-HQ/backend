import { AppError, ErrorCodes } from '@app/nest/errors';
import { EventService, PrismaService } from '@app/nest/modules';
import { VendorCreateData, VendorUpdateData } from '@app/proto/marketplace/vendor-management';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VendorService {
	constructor(
		private prisma: PrismaService,
		private eventService: EventService,
	) {}
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
				ownerId: userId,
				primaryImage: imageUrl,
			},
		});
		await this.eventService.emit('vendor.created', vendor);
		return vendor.id;
	}

	async updateVendor(id: string, userId: string, data: Omit<VendorUpdateData, 'id' | 'userId'>) {
		const exists = await this.prisma.db.vendor.count({
			where: { id, ownerId: userId },
		});

		if (!exists) {
			throw AppError.notFound(ErrorCodes.VENDOR_NOT_FOUND, { vendorId: id });
		}

		const { imageUrl, ...updateData } = data;

		const vendor = await this.prisma.db.vendor.update({
			data: {
				...updateData,
				...(imageUrl ? { primaryImage: imageUrl } : {}),
			},
			where: { id, ownerId: userId },
		});

		await this.eventService.emit('vendor.updated', vendor);
	}

	async deleteVendor(id: string, userId: string) {
		const vendor = await this.prisma.db.vendor.findFirst({
			where: { id, ownerId: userId },
		});
		if (!vendor) {
			throw AppError.notFound(ErrorCodes.VENDOR_NOT_FOUND, { vendorId: id });
		}
		await this.prisma.db.vendor.delete({
			where: { id },
		});
		await this.eventService.emit('vendor.deleted', vendor);
	}
}
