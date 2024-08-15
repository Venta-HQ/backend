import { LoggerModule } from '@app/nest/modules/logger';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { modules, routes } from './router';

@Module({
	imports: [ConfigModule.forRoot(), LoggerModule.register('Gateway'), ...modules, RouterModule.register(routes)],
})
export class AppModule {}
