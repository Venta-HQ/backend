import { PrismaService } from '@app/nest/modules';
import { Injectable, Logger } from '@nestjs/common';
import { IntegrationType, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
	constructor(private prisma: PrismaService) {}
	private readonly logger = new Logger(SubscriptionService.name);

	async handleUserCreated(id: string) {
		const userExists = await this.prisma.db.user.count({
			where: {
				clerkId: id,
			},
		});

		if (!userExists) {
			this.logger.log(`Creating new user`);
			await this.prisma.db.user.create({
				data: {
					clerkId: id,
				},
			});
		} else {
			this.logger.log(`User already exists with clerkId: ${id}`);
		}
	}

	async handleUserDeleted(id: string) {
		this.logger.log(`Deleting user with clerkId: ${id}`);
		await this.prisma.db.user.deleteMany({
			where: {
				clerkId: id,
			},
		});
	}

	async createIntegration({ clerkUserId, data, providerId }: { clerkUserId: string; data?: any; providerId?: string }) {
		this.logger.log('Creating integration record for subscription', {
			clerkUserId: clerkUserId,
			providerId: providerId,
			type: IntegrationType.RevenueCat,
		});
		await this.prisma.db.integration.create({
			data: {
				config: { data, providerId },
				type: IntegrationType.RevenueCat,
				user: {
					connect: {
						clerkId: clerkUserId,
					},
				},
			},
		});
	}

	async createUserSubscription({ clerkUserId }: { clerkUserId: string }) {
		this.logger.log('Creating subscription record for subscription', {
			clerkUserId: clerkUserId,
		});
		await this.prisma.db.userSubscription.create({
			data: {
				status: SubscriptionStatus.Active,
				user: {
					connect: {
						clerkId: clerkUserId,
					},
				},
			},
		});
	}
}
