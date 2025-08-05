import { PrismaService } from '@app/nest/modules';
import { Injectable, Logger } from '@nestjs/common';
import { IntegrationType } from '@prisma/client';

@Injectable()
export class ClerkService {
	constructor(private prisma: PrismaService) {}
	private readonly logger = new Logger(ClerkService.name);

	async handleUserCreated(id: string) {
		this.logger.log(`Creating user with clerkId: ${id}`);

		const user = await this.prisma.db.user.create({
			data: {
				clerkId: id,
			},
			select: { clerkId: true, id: true },
		});

		return user;
	}

	async handleUserDeleted(id: string) {
		this.logger.log(`Deleting user with clerkId: ${id}`);

		// Get user before deletion for event
		await this.prisma.db.user.findFirst({
			select: { clerkId: true, id: true },
			where: { clerkId: id },
		});

		await this.prisma.db.user.deleteMany({
			where: {
				clerkId: id,
			},
		});
	}

	async createIntegration({ data, providerId, userId }: { data?: unknown; providerId?: string; userId: string }) {
		this.logger.log('Creating integration record for clerk account', {
			providerId: providerId,
			type: IntegrationType.Clerk,
			userId: userId,
		});

		await this.prisma.db.integration.create({
			data: {
				data: (data as any) || null,
				providerId: providerId || null,
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

		// Get integration before deletion for event
		await this.prisma.db.integration.findFirst({
			select: { id: true, userId: true },
			where: {
				providerId: providerId,
				type: IntegrationType.Clerk,
			},
		});

		await this.prisma.db.integration.deleteMany({
			where: {
				providerId: providerId,
				type: IntegrationType.Clerk,
			},
		});
	}
}
