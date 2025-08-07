import { Routes } from '@nestjs/core';
import { ClerkWebhooksModule } from '../../../communication/webhooks/clerk-webhooks.module';
import { SubscriptionWebhooksModule } from '../../../communication/webhooks/subscription-webhooks.module';
import { UploadModule } from '../../file-management/src/upload/upload.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';

export const routes: Routes = [
	{
		children: [
			{
				module: ClerkWebhooksModule,
				path: 'clerk',
			},
			{
				module: SubscriptionWebhooksModule,
				path: 'subscription',
			},
		],
		path: 'webhook',
	},
	{
		module: VendorModule,
		path: 'vendor',
	},
	{
		module: UserModule,
		path: 'user',
	},
	{
		module: UploadModule,
		path: 'upload',
	},
];

export const modules = [ClerkWebhooksModule, SubscriptionWebhooksModule, VendorModule, UploadModule, UserModule];
