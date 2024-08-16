import { Routes } from '@nestjs/core';
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
];

export const modules = [ClerkWebhooksModule];
