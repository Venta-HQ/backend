import { Injectable, Logger } from '@nestjs/common';
import { IntegrationType } from '@prisma/client';
import { ClerkAntiCorruptionLayer } from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { PrismaService } from '@venta/nest/modules';

interface IntegrationData {
	clerkUserId: string;
	data?: unknown;
	providerId?: string;
}

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private prisma: PrismaService,
		private readonly clerkACL: ClerkAntiCorruptionLayer,
	) {}

	/**
	 * Handle user identity creation from external auth provider
	 * Domain method for user identity management with business logic
	 */
	async handleUserCreated(id: string): Promise<{ clerkId: string; id: string } | null> {
		this.logger.log('Handling user identity creation from external auth provider', { clerkId: id });

		try {
			// Use anti-corruption layer to validate Clerk user identity
			this.clerkACL.validateUserIdentity({ id });
			const validatedClerkData = { clerkId: id };

			const userExists = await this.prisma.db.user.count({
				where: {
					clerkId: validatedClerkData.clerkId,
				},
			});

			if (!userExists) {
				const user = await this.prisma.db.user.create({
					data: {
						clerkId: validatedClerkData.clerkId,
					},
					select: { clerkId: true, id: true },
				});

				this.logger.log('User identity created successfully from external auth provider', {
					clerkId: validatedClerkData.clerkId,
					userId: user.id,
				});

				return user;
			} else {
				this.logger.log('User identity already exists', { clerkId: validatedClerkData.clerkId });
				return await this.prisma.db.user.findFirst({
					select: { clerkId: true, id: true },
					where: { clerkId: validatedClerkData.clerkId },
				});
			}
		} catch (error) {
			this.logger.error('Failed to handle user identity creation', error.stack, { clerkId: id, error });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'handle_user_created',
				clerkId: id,
			});
		}
	}

	/**
	 * Handle user identity deletion from external auth provider
	 * Domain method for user identity cleanup with business logic
	 */
	async handleUserDeleted(id: string): Promise<void> {
		this.logger.log('Handling user identity deletion from external auth provider', { clerkId: id });

		try {
			// Use anti-corruption layer to validate Clerk user identity
			this.clerkACL.validateUserIdentity({ id });
			const validatedClerkData = { clerkId: id };

			// Get user before deletion for potential event emission
			const user = await this.prisma.db.user.findFirst({
				select: { clerkId: true, id: true },
				where: { clerkId: validatedClerkData.clerkId },
			});

			if (user) {
				await this.prisma.db.user.deleteMany({
					where: {
						clerkId: validatedClerkData.clerkId,
					},
				});

				this.logger.log('User identity deleted successfully from external auth provider', {
					clerkId: validatedClerkData.clerkId,
					userId: user.id,
				});
			} else {
				this.logger.log('User identity not found for deletion', { clerkId: validatedClerkData.clerkId });
			}
		} catch (error) {
			this.logger.error('Failed to handle user identity deletion', error.stack, { clerkId: id, error });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'handle_user_deleted',
				clerkId: id,
			});
		}
	}

	/**
	 * Create authentication integration record
	 * Domain method for auth provider integration
	 */
	async createIntegration(integrationData: IntegrationData): Promise<void> {
		this.logger.log('Creating authentication integration record', {
			clerkUserId: integrationData.clerkUserId,
			providerId: integrationData.providerId,
			type: IntegrationType.Clerk,
		});

		try {
			await this.prisma.db.integration.create({
				data: {
					data: (integrationData.data as any) || null,
					providerId: integrationData.providerId || null,
					type: IntegrationType.Clerk,
					user: {
						connect: {
							clerkId: integrationData.clerkUserId,
						},
					},
				},
			});

			this.logger.log('Authentication integration record created successfully', {
				clerkUserId: integrationData.clerkUserId,
				providerId: integrationData.providerId,
			});
		} catch (error) {
			this.logger.error('Failed to create authentication integration record', error.stack, {
				clerkUserId: integrationData.clerkUserId,
				providerId: integrationData.providerId,
				error,
			});
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_auth_integration',
				clerkUserId: integrationData.clerkUserId,
				providerId: integrationData.providerId,
			});
		}
	}

	/**
	 * Delete authentication integration record
	 * Domain method for auth provider integration cleanup
	 */
	async deleteIntegration({ providerId }: { providerId: string }): Promise<void> {
		this.logger.log('Deleting authentication integration record', {
			providerId,
			type: IntegrationType.Clerk,
		});

		try {
			// Get integration before deletion for potential event emission
			const integration = await this.prisma.db.integration.findFirst({
				select: { id: true, userId: true },
				where: {
					providerId,
					type: IntegrationType.Clerk,
				},
			});

			if (integration) {
				await this.prisma.db.integration.deleteMany({
					where: {
						providerId,
						type: IntegrationType.Clerk,
					},
				});

				this.logger.log('Authentication integration record deleted successfully', {
					integrationId: integration.id,
					providerId,
					userId: integration.userId,
				});
			} else {
				this.logger.log('Authentication integration record not found for deletion', { providerId });
			}
		} catch (error) {
			this.logger.error('Failed to delete authentication integration record', error.stack, { providerId, error });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'delete_auth_integration',
				providerId,
			});
		}
	}
}
