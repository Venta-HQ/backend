import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';
import { RealTime } from '../types/context-mapping.types';

/**
 * Context Mapper for translating between Real-time and Marketplace domains
 */
@Injectable()
export class RealtimeToMarketplaceContextMapper {
	private readonly logger = new Logger(RealtimeToMarketplaceContextMapper.name);

	/**
	 * Convert location update to marketplace format
	 */
	toMarketplaceLocation(update: RealTime.Contracts.LocationUpdate): Marketplace.Core.Location {
		return {
			lat: update.lat,
			lng: update.lng,
		};
	}

	/**
	 * Convert vendor status to marketplace format
	 */
	toMarketplaceVendorStatus(status: RealTime.Contracts.VendorStatus): Marketplace.Core.Vendor['isOpen'] {
		return status.isOnline;
	}

	/**
	 * Convert marketplace vendor location to real-time update
	 */
	fromMarketplaceVendorLocation(
		vendorId: string,
		location: Marketplace.Core.Location,
	): RealTime.Contracts.LocationUpdate {
		return {
			entityId: vendorId,
			lat: location.lat,
			lng: location.lng,
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Convert marketplace vendor status to real-time status
	 */
	fromMarketplaceVendorStatus(vendorId: string, isOpen: boolean): RealTime.Contracts.VendorStatus {
		return {
			vendorId,
			isOnline: isOpen,
			timestamp: new Date().toISOString(),
		};
	}
}
