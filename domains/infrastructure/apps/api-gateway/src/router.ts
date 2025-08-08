import { ClerkWebhooksModule } from '@domains/communication/apps/webhooks/src/clerk/clerk-webhooks.module';
import { RevenueCatWebhooksModule } from '@domains/communication/apps/webhooks/src/revenuecat/revenuecat-webhooks.module';
import { UploadModule } from '@domains/infrastructure/apps/file-management/src/upload/upload.module';
import { Routes } from '@nestjs/core';
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
				module: RevenueCatWebhooksModule,
				path: 'revenuecat',
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

export const modules = [ClerkWebhooksModule, RevenueCatWebhooksModule, VendorModule, UploadModule, UserModule];
