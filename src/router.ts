import { ClerkModule } from './consumers/webhook/clerk/clerk.module';
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
            module: ClerkModule,
          },
        ],
      },
    ],
  },
];

export const modules = [ClerkModule];
