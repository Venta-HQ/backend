import { Routes } from '@nestjs/core';
import { VendorModule } from './vendor/vendor.module';
import { ClerkWebhooksModule } from './webhook/clerk/clerk-webhooks.module';

export const routes: Routes = [
	{
		children: [
			{
				module: ClerkWebhooksModule,
				path: 'clerk',
			},
		],
		path: 'webhook',
	},
	{
		module: VendorModule,
		path: 'vendor',
	},
];

export const modules = [ClerkWebhooksModule, VendorModule];
