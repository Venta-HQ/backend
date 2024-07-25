import { Module } from '@nestjs/common';
import { routes, modules } from './router';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [...modules, RouterModule.register(routes)],
})
export class AppModule {}
