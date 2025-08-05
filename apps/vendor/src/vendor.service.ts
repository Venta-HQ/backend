import { AppError, ErrorCodes } from '@app/nest/errors';
import { MicroserviceEventsService, PrismaService } from '@app/nest/modules';
import { VendorCreateData, VendorUpdateData } from '@app/proto/vendor';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VendorService {
	constructor(
		private prisma: PrismaService,
		private eventsService: MicroserviceEventsService,
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
				owner: {
					connect: {
						id: userId,
					},
				},
				primaryImage: imageUrl,
			},
		});

		await this.emitVendorEvent('vendor.created', vendor);
		return vendor.id;
	}

	async updateVendor(id: string, userId: string, data: Omit<VendorUpdateData, 'id' | 'userId'>) {
		const exists = await this.prisma.db.vendor.count({
			where: { id, owner: { id: userId } },
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
			where: { id, owner: { id: userId } },
		});

		await this.emitVendorEvent('vendor.updated', vendor);
	}

	async deleteVendor(id: string, userId: string) {
		const vendor = await this.prisma.db.vendor.findFirst({
			where: { id, owner: { id: userId } },
		});
		if (!vendor) {
			throw AppError.notFound(ErrorCodes.VENDOR_NOT_FOUND, { vendorId: id });
		}
		await this.prisma.db.vendor.delete({
			where: { id },
		});
		await this.emitVendorEvent('vendor.deleted', vendor);
	}

	private async emitVendorEvent(
		type: 'vendor.created' | 'vendor.updated' | 'vendor.deleted',
		vendor: Record<string, unknown>,
	) {
		// Standardize key order
		const payload = {
			createdAt: vendor.createdAt,
			description: vendor.description,
			email: vendor.email,
			id: vendor.id,
			lat: vendor.lat,
			long: vendor.long,
			name: vendor.name,
			open: vendor.open,
			phone: vendor.phone,
			primaryImage: vendor.primaryImage,
			updatedAt: vendor.updatedAt,
			website: vendor.website,
		};

		await this.eventsService.publishVendorEvent(type, payload);
	}
}
