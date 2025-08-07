import { Routes } from '@nestjs/core';
import { ClerkWebhooksModule } from '../../../communication/webhooks/src/clerk/clerk-webhooks.module';
import { RevenueCatWebhooksModule } from '../../../communication/webhooks/src/revenuecat/revenuecat-webhooks.module';
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
