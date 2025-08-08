import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Injectable } from '@nestjs/common';
import { Infrastructure } from '../types/context-mapping.types';

/**
 * Context mapper for translating between Infrastructure and Marketplace domains
 */
@Injectable()
export class InfrastructureToMarketplaceContextMapper {
	/**
	 * Convert HTTP vendor create data to gRPC vendor create data
	 */
	toGrpcVendorCreateData(
		data: Infrastructure.Core.VendorCreateData,
		userId: string,
	): Marketplace.Core.VendorCreateData {
		return {
			name: data.name,
			description: data.description || '',
			email: data.email || '',
			phone: data.phone || '',
			website: data.website || '',
			imageUrl: data.imageUrl || '',
			userId,
		};
	}

	/**
	 * Convert HTTP vendor update data to gRPC vendor update data
	 */
	toGrpcVendorUpdateData(
		data: Infrastructure.Core.VendorUpdateData,
		vendorId: string,
		userId: string,
	): Marketplace.Core.VendorUpdateData {
		return {
			id: vendorId,
			name: data.name,
			description: data.description || '',
			email: data.email || '',
			phone: data.phone || '',
			website: data.website || '',
			imageUrl: data.imageUrl || '',
			userId,
		};
	}

	/**
	 * Convert HTTP user vendor request to gRPC user vendor request
	 */
	toGrpcUserVendorRequest(userId: string): Marketplace.Core.UserVendorRequest {
		return {
			userId,
		};
	}
}
