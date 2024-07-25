import { Inject, Injectable } from '@nestjs/common';
import { UserWebhookEvent } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ClerkWebhooksService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async handleUserCreated(event: UserWebhookEvent) {
    const userExists = await this.prisma.user.count({
      where: {
        clerkId: event.data.id,
      },
    });

    if (!userExists) {
      await this.prisma.user.create({
        data: {
          clerkId: event.data.id,
        },
      });
    }
  }

  async handleUserDeleted(event: UserWebhookEvent) {
    await this.prisma.user.delete({
      where: {
        clerkId: event.data.id,
      },
    });
  }
}
