import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events.module';
import { NatsEventsService } from './nats-events.service';

describe('EventsModule', () => {
	let module: TestingModule;
	let eventsService: NatsEventsService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
				}),
				EventsModule,
			],
		}).compile();

		eventsService = module.get<NatsEventsService>('EventsService');
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(module).toBeDefined();
	});

	it('should provide EventsService', () => {
		expect(eventsService).toBeDefined();
		expect(eventsService).toBeInstanceOf(NatsEventsService);
	});

	it('should have healthCheck method', () => {
		expect(typeof eventsService.healthCheck).toBe('function');
	});

	it('should have publishEvent method', () => {
		expect(typeof eventsService.publishEvent).toBe('function');
	});

	it('should have subscribeToEventType method', () => {
		expect(typeof eventsService.subscribeToEventType).toBe('function');
	});

	it('should have subscribeToEvents method', () => {
		expect(typeof eventsService.subscribeToEvents).toBe('function');
	});

	it('should have subscribeToStream method', () => {
		expect(typeof eventsService.subscribeToStream).toBe('function');
	});

	it('should have unsubscribeFromStream method', () => {
		expect(typeof eventsService.unsubscribeFromStream).toBe('function');
	});

	it('should have getActiveStreams method', () => {
		expect(typeof eventsService.getActiveStreams).toBe('function');
	});
}); 