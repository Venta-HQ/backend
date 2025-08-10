import { AppError, ErrorCodes } from '@venta/nest/errors';
import type { CreateSubscriptionData } from '@venta/proto/marketplace/user-management';
import type { SubscriptionCreate } from '../types/domain';

/**
 * Subscription ACL
 *
 * Handles transformation between subscription gRPC data and internal domain types.
 * This processes subscription data that has already been processed through webhook handlers.
 */
export class SubscriptionCreateACL {
	/**
	 * Validate subscription data from gRPC
	 */
	static validate(grpc: CreateSubscriptionData): void {
		if (!grpc.clerkUserId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'clerkUserId',
				message: 'Clerk User ID is required',
			});
		}

		if (!grpc.providerId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'providerId',
				message: 'Provider ID is required',
			});
		}

		if (!grpc.data) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'data',
				message: 'Subscription data is required',
			});
		}

		if (!grpc.data.transactionId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'data.transactionId',
				message: 'Transaction ID is required',
			});
		}

		if (!grpc.data.productId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'data.productId',
				message: 'Product ID is required',
			});
		}
	}

	/**
	 * Transform subscription gRPC data to internal domain subscription create type
	 */
	static toDomain(grpc: CreateSubscriptionData): SubscriptionCreate {
		this.validate(grpc);

		return {
			userId: grpc.clerkUserId,
			providerId: grpc.providerId,
			data: {
				eventId: grpc.data!.eventId,
				productId: grpc.data!.productId,
				transactionId: grpc.data!.transactionId,
			},
		};
	}

	/**
	 * Validate domain subscription create data
	 */
	static validateDomain(domain: SubscriptionCreate): void {
		if (!domain.userId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'userId',
				message: 'User ID is required',
			});
		}

		if (!domain.providerId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'providerId',
				message: 'Provider ID is required',
			});
		}

		if (!domain.data.transactionId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'data.transactionId',
				message: 'Transaction ID is required',
			});
		}

		if (!domain.data.productId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'data.productId',
				message: 'Product ID is required',
			});
		}
	}

	/**
	 * Transform internal domain subscription to gRPC format
	 */
	static toGrpc(domain: SubscriptionCreate): CreateSubscriptionData {
		this.validateDomain(domain);

		return {
			clerkUserId: domain.userId,
			providerId: domain.providerId,
			data: {
				eventId: domain.data.eventId,
				productId: domain.data.productId,
				transactionId: domain.data.transactionId,
			},
		};
	}
}
