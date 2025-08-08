import { Injectable, Logger } from '@nestjs/common';
import {
	CommunicationExternalSubscriptionData,
	CommunicationExternalUserData,
	CommunicationMarketplaceMapping,
} from '../types';

/**
 * Communication to Marketplace Context Mapper
 *
 * Translates communication domain data structures to marketplace domain data structures.
 * This is a directional mapper - it only handles communication -> marketplace translations.
 */
@Injectable()
export class CommunicationToMarketplaceContextMapper {
	private readonly logger = new Logger(CommunicationToMarketplaceContextMapper.name);

	/**
	 * Maps external user data to marketplace format
	 */
	toMarketplaceExternalUser(
		userData: CommunicationExternalUserData,
		marketplaceUserId: string,
	): CommunicationMarketplaceMapping['externalUser'] {
		this.logger.debug('Mapping external user data to marketplace format', {
			externalUserId: userData.externalUserId,
			service: userData.service,
			marketplaceUserId,
		});

		return {
			externalUserId: userData.externalUserId,
			externalService: userData.service,
			marketplaceUserId,
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Maps external subscription data to marketplace format
	 */
	toMarketplaceExternalSubscription(
		subscriptionData: CommunicationExternalSubscriptionData,
		marketplaceSubscriptionId: string,
	): CommunicationMarketplaceMapping['externalSubscription'] {
		this.logger.debug('Mapping external subscription data to marketplace format', {
			externalSubscriptionId: subscriptionData.externalSubscriptionId,
			service: subscriptionData.service,
			marketplaceSubscriptionId,
		});

		return {
			externalSubscriptionId: subscriptionData.externalSubscriptionId,
			externalService: subscriptionData.service,
			marketplaceSubscriptionId,
			timestamp: new Date().toISOString(),
		};
	}
}
