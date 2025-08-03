import { IEventsService } from '@app/events';
import { Controller, Get, HttpCode, HttpStatus, Inject, Query } from '@nestjs/common';

@Controller('events')
export class EventSourcingController {
	constructor(@Inject('EventsService') private readonly eventsService: IEventsService) {}

	/**
	 * Get event history for a specific aggregate
	 */
	@Get('history')
	@HttpCode(HttpStatus.OK)
	async getEventHistory(@Query('aggregateId') aggregateId?: string, @Query('aggregateType') aggregateType?: string) {
		if (!aggregateId || !aggregateType) {
			return {
				message: 'Both aggregateId and aggregateType are required',
				events: [],
			};
		}

		const events = await this.eventsService.getEventHistory(aggregateId, aggregateType);

		return {
			aggregateId,
			aggregateType,
			totalEvents: events.length,
			events: events.map((event) => ({
				id: event.messageId,
				type: event.type,
				timestamp: event.timestamp,
				version: event.version,
				userId: event.userId,
				data: event.data,
				metadata: event.metadata,
			})),
		};
	}

	/**
	 * Replay events with filtering options
	 */
	@Get('replay')
	@HttpCode(HttpStatus.OK)
	async replayEvents(
		@Query('aggregateId') aggregateId?: string,
		@Query('aggregateType') aggregateType?: string,
		@Query('fromTimestamp') fromTimestamp?: string,
		@Query('toTimestamp') toTimestamp?: string,
		@Query('eventTypes') eventTypes?: string,
		@Query('limit') limit?: string,
	) {
		const options = {
			aggregateId,
			aggregateType,
			fromTimestamp,
			toTimestamp,
			eventTypes: eventTypes ? eventTypes.split(',') : undefined,
			limit: limit ? parseInt(limit, 10) : undefined,
		};

		const events = await this.eventsService.replayEvents(options);

		return {
			filters: options,
			totalEvents: events.length,
			events: events.map((event) => ({
				id: event.messageId,
				type: event.type,
				timestamp: event.timestamp,
				version: event.version,
				aggregateId: event.aggregateId,
				aggregateType: event.aggregateType,
				userId: event.userId,
				data: event.data,
				metadata: event.metadata,
			})),
		};
	}

	/**
	 * Get events for a specific aggregate
	 */
	@Get('aggregate')
	@HttpCode(HttpStatus.OK)
	async getAggregateEvents(@Query('aggregateId') aggregateId: string, @Query('aggregateType') aggregateType: string) {
		if (!aggregateId || !aggregateType) {
			return {
				message: 'Both aggregateId and aggregateType are required',
				events: [],
			};
		}

		const events = await this.eventsService.getEventsForAggregate(aggregateId, aggregateType);

		return {
			aggregateId,
			aggregateType,
			totalEvents: events.length,
			latestVersion: events.length > 0 ? Math.max(...events.map((e) => e.version || 0)) : 0,
			events: events.map((event) => ({
				id: event.messageId,
				type: event.type,
				timestamp: event.timestamp,
				version: event.version,
				userId: event.userId,
				data: event.data,
				metadata: event.metadata,
			})),
		};
	}

	/**
	 * Get event statistics
	 */
	@Get('stats')
	@HttpCode(HttpStatus.OK)
	async getEventStats() {
		const allEvents = await this.eventsService.getEventHistory();

		// Group events by type
		const eventTypeStats = allEvents.reduce(
			(acc, event) => {
				acc[event.type] = (acc[event.type] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		// Group events by aggregate type
		const aggregateTypeStats = allEvents.reduce(
			(acc, event) => {
				if (event.aggregateType) {
					acc[event.aggregateType] = (acc[event.aggregateType] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>,
		);

		// Get unique aggregates
		const uniqueAggregates = new Set(
			allEvents
				.filter((event) => event.aggregateId && event.aggregateType)
				.map((event) => `${event.aggregateType}:${event.aggregateId}`),
		);

		return {
			totalEvents: allEvents.length,
			uniqueAggregates: uniqueAggregates.size,
			eventTypes: Object.keys(eventTypeStats).length,
			eventTypeBreakdown: eventTypeStats,
			aggregateTypeBreakdown: aggregateTypeStats,
			timeRange:
				allEvents.length > 0
					? {
							earliest: allEvents[0]?.timestamp,
							latest: allEvents[allEvents.length - 1]?.timestamp,
						}
					: null,
		};
	}
}
