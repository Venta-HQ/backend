import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserWebhookEvent } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ClerkWebhooksService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}
  private readonly logger = new Logger(ClerkWebhooksService.name);

  async handleUserCreated(event: UserWebhookEvent) {
    const userExists = await this.prisma.user.count({
      where: {
        clerkId: event.data.id,
      },
    });

    if (!userExists) {
      this.logger.log(`Creating new user`);
      await this.prisma.user.create({
        data: {
          clerkId: event.data.id,
        },
      });
    } else {
      this.logger.log(`User already exists with clerkId: ${event.data.id}`);
    }
  }

  async handleUserDeleted(event: UserWebhookEvent) {
    this.logger.log(`Deleting user with clerkId: ${event.data.id}`);
    await this.prisma.user.deleteMany({
      where: {
        clerkId: event.data.id,
      },
    });
  }
}
