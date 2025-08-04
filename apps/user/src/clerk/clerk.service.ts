import { IEventsService, PrismaService } from '@app/nest/modules';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IntegrationType } from '@prisma/client';

@Injectable()
export class ClerkService {
	constructor(
		private prisma: PrismaService,
		@Inject('EventsService') private eventsService: IEventsService,
	) {}
	private readonly logger = new Logger(ClerkService.name);

	async handleUserCreated(id: string) {
		this.logger.log(`Creating user with clerkId: ${id}`);

		const user = await this.prisma.db.user.create({
			data: {
				clerkId: id,
			},
			select: { clerkId: true, id: true },
		});

		// Emit user created event
		await this.eventsService.publishEvent('user.created', {
			clerkId: user.clerkId,
			timestamp: new Date().toISOString(),
			userId: user.id,
		});

		return user;
	}

	async handleUserDeleted(id: string) {
		this.logger.log(`Deleting user with clerkId: ${id}`);

		// Get user before deletion for event
		const user = await this.prisma.db.user.findFirst({
			select: { clerkId: true, id: true },
			where: { clerkId: id },
		});

		await this.prisma.db.user.deleteMany({
			where: {
				clerkId: id,
			},
		});

		// Emit user deleted event if user existed
		if (user) {
			await this.eventsService.publishEvent('user.deleted', {
				clerkId: user.clerkId,
				timestamp: new Date().toISOString(),
				userId: user.id,
			});
		}
	}

	async createIntegration({ data, providerId, userId }: { data?: unknown; providerId?: string; userId: string }) {
		this.logger.log('Creating integration record for clerk account', {
			providerId: providerId,
			type: IntegrationType.Clerk,
			userId: userId,
		});

		const integration = await this.prisma.db.integration.create({
			data: {
				data: (data as any) || null,
				providerId: providerId || null,
				type: IntegrationType.Clerk,
				userId: userId,
			},
		});

		// Emit integration created event
		await this.eventsService.publishEvent('user.integration.created', {
			integrationId: integration.id,
			providerId,
			timestamp: new Date().toISOString(),
			type: IntegrationType.Clerk,
			userId,
		});
	}

	async deleteIntegration({ providerId }: { providerId: string }) {
		this.logger.log('Deleting integration record for clerk account', {
			providerId: providerId,
			type: IntegrationType.Clerk,
		});

		// Get integration before deletion for event
		const integration = await this.prisma.db.integration.findFirst({
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

		// Emit integration deleted event if integration existed
		if (integration) {
			await this.eventsService.publishEvent('user.integration.deleted', {
				integrationId: integration.id,
				providerId,
				timestamp: new Date().toISOString(),
				type: IntegrationType.Clerk,
				userId: integration.userId,
			});
		}
	}
}
