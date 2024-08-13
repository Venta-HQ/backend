import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ClerkWebhooksService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}
  private readonly logger = new Logger(ClerkWebhooksService.name);

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
}
