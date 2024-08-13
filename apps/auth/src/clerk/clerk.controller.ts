import { Controller, Logger } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { GrpcMethod } from '@nestjs/microservices';
import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import {
  AUTH_SERVICE_NAME,
  ClerkWebhookEvent,
  ClerkWebhookResponse
} from '@app/proto/auth';

@Controller()
export class ClerkController {
  private readonly logger = new Logger(ClerkController.name);
  
  constructor(
    private readonly clerkService: ClerkService
  ) {}

  
  @GrpcMethod(AUTH_SERVICE_NAME, 'HandleClerkUserCreated')
  async handleClerkUserCreated(
    data: ClerkWebhookEvent,
    metadata: Metadata, call: ServerUnaryCall<any, any>
  ): Promise<ClerkWebhookResponse> {
    this.logger.log(`Handling Clerk Webhook Event from Microservice: ${data.type}`);
    await this.clerkService.handleUserCreated(data.event.id);

    return { message: 'Success' };
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'HandleClerkUserDeleted')
  async handleClerkUserDeleted(
    data: ClerkWebhookEvent,
    metadata: Metadata, call: ServerUnaryCall<any, any>
  ): Promise<ClerkWebhookResponse> {
    this.logger.log(`Handling Clerk Webhook Event from Microservice: ${data.type}`);
    await this.clerkService.handleUserDeleted(data.event.id);

    return { message: 'Success' };
  }

}
