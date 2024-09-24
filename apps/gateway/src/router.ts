import { Routes } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';
import { ClerkWebhooksModule } from './webhook/clerk/clerk-webhooks.module';
import { SubscriptionWebhooksModule } from './webhook/subscription/subscription-webhooks.module';

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
];

export const modules = [ClerkWebhooksModule, SubscriptionWebhooksModule, VendorModule, UserModule];
