import { GrpcInstanceModule } from '@app/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME } from '@app/proto/marketplace/user-management';
import { Module } from '@nestjs/common';
import { CommunicationToMarketplaceContextMapper } from '../../../../contracts/context-mappers/communication-to-marketplace-context-mapper';
import { ClerkWebhooksController } from './clerk-webhooks.controller';

@Module({
	imports: [
		GrpcInstanceModule.register({
			serviceName: USER_MANAGEMENT_SERVICE_NAME,
			proto: 'marketplace/user-management.proto',
			protoPackage: 'marketplace.user_management',
			provide: USER_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService) => configService.get<string>('MARKETPLACE_USER_MANAGEMENT_SERVICE_URL') || '',
		}),
	],
	controllers: [ClerkWebhooksController],
	providers: [CommunicationToMarketplaceContextMapper],
})
export class ClerkWebhooksModule {}
