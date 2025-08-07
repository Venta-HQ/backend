import { Module } from '@nestjs/common';
import { UserLocationEventsController } from './user-location-events.controller';
import { UserService } from './user.service';

@Module({
	providers: [UserService],
	controllers: [UserLocationEventsController],
	exports: [UserService],
})
export class CoreModule {} 