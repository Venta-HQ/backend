import { Routes } from '@nestjs/core';
import { ClerkWebhooksModule } from './consumers/webhook/clerk/clerk-webhooks.module';

export const routes: Routes = [
	{
		children: [
			{
				children: [
					{
						module: ClerkWebhooksModule,
						path: 'clerk',
					},
				],
				path: 'webhooks',
			},
		],
		path: 'consumers',
	},
];

export const modules = [ClerkWebhooksModule];
