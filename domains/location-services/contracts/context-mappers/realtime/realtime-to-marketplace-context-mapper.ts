import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';
import { LocationServices } from '../../types/context-mapping.types';

/**
 * Context Mapper for translating between Real-time and Marketplace domains
 */
@Injectable()
export class RealtimeToMarketplaceContextMapper {
	private readonly logger = new Logger(RealtimeToMarketplaceContextMapper.name);

	/**
	 * Convert location update to marketplace format
	 */
	toMarketplaceLocation(update: LocationServices.RealTime.Contracts.LocationUpdate): Marketplace.Core.Location {
		return {
			lat: update.lat,
			long: update.lng,
		};
	}

	/**
	 * Convert vendor status to marketplace format
	 */
	toMarketplaceVendorStatus(
		status: LocationServices.RealTime.Contracts.VendorStatus,
	): Marketplace.Core.Vendor['isOpen'] {
		return status.isOnline;
	}

	/**
	 * Convert marketplace vendor location to real-time update
	 */
	fromMarketplaceVendorLocation(
		vendorId: string,
		location: Marketplace.Core.Location,
	): LocationServices.RealTime.Contracts.LocationUpdate {
		return {
			entityId: vendorId,
			lat: location.lat,
			lng: location.long,
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Convert marketplace vendor status to real-time status
	 */
	fromMarketplaceVendorStatus(vendorId: string, isOpen: boolean): LocationServices.RealTime.Contracts.VendorStatus {
		return {
			vendorId,
			isOnline: isOpen,
			timestamp: new Date().toISOString(),
		};
	}
}
