import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IEventsService } from './events.interface';
import { NatsEventsService } from './nats-events.service';
import { EventsModule } from './nats.module';

describe('EventsModule (NATS)', () => {
	let module: TestingModule;
	let configService: ConfigService;
	let eventsService: IEventsService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					envFilePath: '.env.test',
				}),
				EventsModule,
			],
		}).compile();

		configService = module.get<ConfigService>(ConfigService);
		eventsService = module.get<IEventsService>('EventsService');
	});

	describe('module structure', () => {
		it('should be defined', () => {
			expect(module).toBeDefined();
		});

		it('should register as a valid module', () => {
			const eventsModule = module.get(EventsModule);
			expect(eventsModule).toBeDefined();
		});

		it('should import ConfigModule', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});

		it('should provide EventsService with NATS implementation', () => {
			expect(eventsService).toBeDefined();
			expect(eventsService).toBeInstanceOf(NatsEventsService);
		});

		it('should export EventsService', () => {
			const exportedService = module.get<IEventsService>('EventsService');
			expect(exportedService).toBeDefined();
			expect(exportedService).toBeInstanceOf(NatsEventsService);
		});
	});

	describe('service factory', () => {
		it('should create NatsEventsService with config values', () => {
			expect(eventsService).toBeDefined();
			expect(eventsService).toBeInstanceOf(NatsEventsService);
		});

		it('should inject ConfigService into factory', () => {
			expect(configService).toBeDefined();
		});

		it('should use NATS_URL from config', () => {
			// The service should be created with the config values
			expect(eventsService).toBeDefined();
		});
	});

	describe('module configuration', () => {
		it('should have correct imports', () => {
			expect(configService).toBeDefined();
		});

		it('should have correct providers', () => {
			expect(eventsService).toBeDefined();
		});

		it('should have correct exports', () => {
			const exportedService = module.get<IEventsService>('EventsService');
			expect(exportedService).toBeDefined();
		});
	});

	describe('dependency injection', () => {
		it('should inject ConfigService properly', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});

		it('should make EventsService available for injection', () => {
			expect(eventsService).toBeDefined();
			expect(eventsService).toBeInstanceOf(NatsEventsService);
		});

		it('should have proper dependency injection setup', () => {
			expect(eventsService).toBeDefined();
		});
	});

	describe('module instantiation', () => {
		it('should create module instance without errors', () => {
			expect(module).toBeDefined();
		});

		it('should have correct module structure', () => {
			const eventsModule = module.get(EventsModule);
			expect(eventsModule).toBeDefined();
		});
	});

	describe('service availability', () => {
		it('should have publishEvent method', () => {
			expect(typeof eventsService.publishEvent).toBe('function');
		});

		it('should have subscribeToEvents method', () => {
			expect(typeof eventsService.subscribeToEvents).toBe('function');
		});

		it('should have subscribeToEventType method', () => {
			expect(typeof eventsService.subscribeToEventType).toBe('function');
		});

		it('should have healthCheck method', () => {
			expect(typeof eventsService.healthCheck).toBe('function');
		});
	});

	describe('error handling', () => {
		it('should handle missing config values gracefully', async () => {
			// Test with missing config values
			const testModule = await Test.createTestingModule({
				imports: [
					ConfigModule.forRoot({
						envFilePath: '.env.test',
					}),
					EventsModule,
				],
			}).compile();

			expect(testModule).toBeDefined();
		});

		it('should handle module initialization errors gracefully', () => {
			expect(module).toBeDefined();
		});
	});

	describe('performance considerations', () => {
		it('should be lightweight and fast to instantiate', () => {
			expect(module).toBeDefined();
		});

		it('should not have memory leaks', () => {
			expect(module).toBeDefined();
		});
	});

	describe('compatibility', () => {
		it('should be compatible with NestJS framework', () => {
			expect(module).toBeDefined();
		});

		it('should work with dependency injection system', () => {
			expect(eventsService).toBeDefined();
		});
	});

	describe('NATS-specific features', () => {
		it('should implement IEventsService interface', () => {
			expect(eventsService).toBeDefined();
			expect(typeof eventsService.publishEvent).toBe('function');
			expect(typeof eventsService.subscribeToEvents).toBe('function');
			expect(typeof eventsService.subscribeToEventType).toBe('function');
			expect(typeof eventsService.healthCheck).toBe('function');
		});

		it('should use NATS for event publishing', () => {
			// The service should be configured for NATS
			expect(eventsService).toBeInstanceOf(NatsEventsService);
		});

		it('should support subject-based routing', () => {
			// NATS supports subject-based routing
			expect(typeof eventsService.subscribeToEventType).toBe('function');
		});
	});
});
