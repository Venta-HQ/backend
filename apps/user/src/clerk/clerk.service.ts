import { PrismaService } from '@app/database';
import { Injectable, Logger } from '@nestjs/common';
import { IntegrationType } from '@prisma/client';

@Injectable()
export class ClerkService {
	constructor(private prisma: PrismaService) {}
	private readonly logger = new Logger(ClerkService.name);

	async handleUserCreated(id: string) {
		const userExists = await this.prisma.db.user.count({
			where: {
				clerkId: id,
			},
		});

		if (!userExists) {
			this.logger.log(`Creating new user`);
			return await this.prisma.db.user.create({
				data: {
					clerkId: id,
				},
				select: { clerkId: true, id: true },
			});
		} else {
			this.logger.log(`User already exists with clerkId: ${id}`);
			return null;
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

	async createIntegration({ data, providerId, userId }: { data?: any; providerId?: string; userId: string }) {
		this.logger.log('Creating integration record for clerk account', {
			providerId: providerId,
			type: IntegrationType.Clerk,
			userId: userId,
		});
		await this.prisma.db.integration.create({
			data: {
				config: { data, providerId },
				type: IntegrationType.Clerk,
				userId: userId,
			},
		});
	}

	async deleteIntegration({ providerId }: { providerId: string }) {
		this.logger.log('Deleting integration record for clerk account', {
			providerId: providerId,
			type: IntegrationType.Clerk,
		});
		await this.prisma.db.integration.deleteMany({
			where: {
				config: {
					equals: providerId,
					path: ['providerId'],
				},
				type: IntegrationType.Clerk,
			},
		});
	}
}
