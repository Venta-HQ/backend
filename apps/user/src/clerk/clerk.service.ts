import { PrismaService } from '@app/database';
import { IEventsService } from '@app/events';
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

		// Emit user created event with event sourcing
		await this.eventsService.publishEvent('user.created', {
			userId: user.id,
			clerkId: user.clerkId,
			timestamp: new Date().toISOString(),
		}, {
			aggregateId: user.id,
			aggregateType: 'user',
			userId: id, // Clerk ID as the user who triggered the event
			metadata: {
				source: 'clerk',
				clerkId: id
			}
		});

		return user;
	}

	async handleUserDeleted(id: string) {
		this.logger.log(`Deleting user with clerkId: ${id}`);

		// Get user before deletion for event
		const user = await this.prisma.db.user.findFirst({
			where: { clerkId: id },
			select: { id: true, clerkId: true },
		});

		await this.prisma.db.user.deleteMany({
			where: {
				clerkId: id,
			},
		});

		// Emit user deleted event if user existed
		if (user) {
			await this.eventsService.publishEvent('user.deleted', {
				userId: user.id,
				clerkId: user.clerkId,
				timestamp: new Date().toISOString(),
			}, {
				aggregateId: user.id,
				aggregateType: 'user',
				userId: id, // Clerk ID as the user who triggered the event
				metadata: {
					source: 'clerk',
					clerkId: id
				}
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
				config: { data: data || null, providerId: providerId || null },
				type: IntegrationType.Clerk,
				userId: userId,
			},
		});

		// Emit integration created event with event sourcing
		await this.eventsService.publishEvent('user.integration.created', {
			integrationId: integration.id,
			userId,
			providerId,
			type: IntegrationType.Clerk,
			timestamp: new Date().toISOString(),
		}, {
			aggregateId: userId,
			aggregateType: 'user',
			userId: userId,
			metadata: {
				integrationId: integration.id,
				providerId,
				integrationType: IntegrationType.Clerk
			}
		});
	}

	async deleteIntegration({ providerId }: { providerId: string }) {
		this.logger.log('Deleting integration record for clerk account', {
			providerId: providerId,
			type: IntegrationType.Clerk,
		});

		// Get integration before deletion for event
		const integration = await this.prisma.db.integration.findFirst({
			where: {
				config: {
					equals: providerId,
					path: ['providerId'],
				},
				type: IntegrationType.Clerk,
			},
			select: { id: true, userId: true },
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

		// Emit integration deleted event if integration existed
		if (integration) {
			await this.eventsService.publishEvent('user.integration.deleted', {
				integrationId: integration.id,
				userId: integration.userId,
				providerId,
				type: IntegrationType.Clerk,
				timestamp: new Date().toISOString(),
			}, {
				aggregateId: integration.userId,
				aggregateType: 'user',
				userId: integration.userId,
				metadata: {
					integrationId: integration.id,
					providerId,
					integrationType: IntegrationType.Clerk
				}
			});
		}
	}
}
