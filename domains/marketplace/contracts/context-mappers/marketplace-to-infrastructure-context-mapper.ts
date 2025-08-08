import { Injectable } from '@nestjs/common';
import { Marketplace } from '../types/context-mapping.types';

/**
 * Context mapper for translating between Marketplace and Infrastructure domains
 */
@Injectable()
export class MarketplaceToInfrastructureContextMapper {
	/**
	 * Convert user avatar to infrastructure file upload
	 */
	toInfrastructureFileUpload(avatar: Marketplace.Core.UserAvatar): Infrastructure.Contracts.FileUpload {
		return {
			fileId: avatar.fileId,
			url: avatar.url,
			uploadedAt: avatar.uploadedAt,
			context: 'user_avatar',
		};
	}

	/**
	 * Convert vendor logo to infrastructure file upload
	 */
	toInfrastructureFileUpload(logo: Marketplace.Core.VendorLogo): Infrastructure.Contracts.FileUpload {
		return {
			fileId: logo.fileId,
			url: logo.url,
			uploadedAt: logo.uploadedAt,
			context: 'vendor_logo',
		};
	}

	/**
	 * Convert infrastructure file upload result to user avatar
	 */
	toUserAvatar(result: Infrastructure.Contracts.FileUploadResult): Marketplace.Core.UserAvatar {
		return {
			fileId: result.fileId,
			url: result.url,
			uploadedAt: result.timestamp,
		};
	}

	/**
	 * Convert infrastructure file upload result to vendor logo
	 */
	toVendorLogo(result: Infrastructure.Contracts.FileUploadResult): Marketplace.Core.VendorLogo {
		return {
			fileId: result.fileId,
			url: result.url,
			uploadedAt: result.timestamp,
		};
	}
}
