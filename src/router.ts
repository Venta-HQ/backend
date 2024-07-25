import { ClerkWebhooksModule } from './consumers/webhook/clerk/clerk-webhooks.module';
import { Routes } from '@nestjs/core';

export const routes: Routes = [
  {
    path: 'consumers',
    children: [
      {
        path: 'webhooks',
        children: [
          {
            path: 'clerk',
            module: ClerkWebhooksModule,
          },
        ],
      },
    ],
  },
];

export const modules = [ClerkWebhooksModule];
