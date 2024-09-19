import { Inject, Injectable, Logger } from '@nestjs/common';
import { IntegrationType, PrismaClient, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
	constructor(@Inject('PRISMA') private prisma: PrismaClient) {}
	private readonly logger = new Logger(SubscriptionService.name);

	async handleUserCreated(id: string) {
		const userExists = await this.prisma.user.count({
			where: {
				clerkId: id,
			},
		});

		if (!userExists) {
			this.logger.log(`Creating new user`);
			await this.prisma.user.create({
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
		await this.prisma.user.deleteMany({
			where: {
				clerkId: id,
			},
		});
	}

	async createIntegration({ data, providerId, userId }: { data?: any; providerId?: string; userId: string }) {
		this.logger.log('Creating integration record for subscription', {
			providerId: providerId,
			type: IntegrationType.RevenueCat,
			userId: userId,
		});
		await this.prisma.integration.create({
			data: {
				data,
				providerId,
				type: IntegrationType.RevenueCat,
				user: {
					connect: {
						id: userId,
					},
				},
			},
		});
	}

	async createUserSubscription({ userId }: { userId: string }) {
		this.logger.log('Creating subscription record for subscription', {
			userId: userId,
		});
		await this.prisma.userSubscription.create({
			data: {
				status: SubscriptionStatus.Active,
				user: {
					connect: {
						id: userId,
					},
				},
			},
		});
	}
}
