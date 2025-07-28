import { IEventsService } from '@app/nest/modules';
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
			status: 'ok',
			service: 'algolia-sync-events',
			eventsHealth: health,
			timestamp: new Date().toISOString(),
		};
	}
}
