import { LoggerModule } from './logger.module';
import { Logger } from './logger.service';
import { LokiTransportService } from './loki-transport.service';

describe('LoggerModule', () => {
	describe('register', () => {
		it('should register with default configuration', () => {
			const dynamicModule = LoggerModule.register();

			expect(dynamicModule.module).toBe(LoggerModule);
			expect(dynamicModule.global).toBe(true);
			expect(dynamicModule.exports).toContain(Logger);
			expect(dynamicModule.providers).toHaveLength(4);
			expect(dynamicModule.providers).toContain(Logger);
			expect(dynamicModule.providers).toContain(LokiTransportService);

			// Check that LOGGER_OPTIONS provider is created with factory
			const loggerOptionsProvider = dynamicModule.providers?.find(
				(provider: any) => provider.provide === 'LOGGER_OPTIONS',
			);
			expect(loggerOptionsProvider).toBeDefined();
			expect(loggerOptionsProvider?.useFactory).toBeDefined();
		});
	});
});
