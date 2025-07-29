import { IEventsService } from '@app/events';
import { Controller, Get, Inject } from '@nestjs/common';

@Controller('health')
export class AlgoliaSyncController {
	constructor(@Inject('EventsService') private readonly eventsService: IEventsService) {}

	@Get()
	health() {
		return {
			service: 'algolia-sync',
			status: 'ok',
			timestamp: new Date().toISOString(),
		};
	}

	@Get('events')
	async eventsHealth() {
		const health = await this.eventsService.healthCheck();
		return {
			eventsHealth: health,
			service: 'algolia-sync-events',
			status: 'ok',
			timestamp: new Date().toISOString(),
		};
	}
}
