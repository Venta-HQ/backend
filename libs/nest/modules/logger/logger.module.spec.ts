import { Logger } from './logger.service';
import { LokiTransportService } from './loki-transport.service';
import { LoggerModule } from './logger.module';

describe('LoggerModule', () => {
	describe('register', () => {
		it('should register with string app name', () => {
			const dynamicModule = LoggerModule.register('test-app');

			expect(dynamicModule.module).toBe(LoggerModule);
			expect(dynamicModule.global).toBe(true);
			expect(dynamicModule.exports).toContain(Logger);
			expect(dynamicModule.providers).toHaveLength(3);
			expect(dynamicModule.providers).toContain(Logger);
			expect(dynamicModule.providers).toContain(LokiTransportService);
			
			// Check that LOGGER_OPTIONS provider is created with correct app name
			const loggerOptionsProvider = dynamicModule.providers?.find(
				(provider: any) => provider.provide === 'LOGGER_OPTIONS'
			);
			expect(loggerOptionsProvider).toBeDefined();
			expect(loggerOptionsProvider?.useValue).toEqual({ appName: 'test-app' });
		});

		it('should register with options object', () => {
			const dynamicModule = LoggerModule.register({ appName: 'test-app-options' });

			expect(dynamicModule.module).toBe(LoggerModule);
			expect(dynamicModule.global).toBe(true);
			expect(dynamicModule.exports).toContain(Logger);
			expect(dynamicModule.providers).toHaveLength(3);
			
			// Check that LOGGER_OPTIONS provider is created with correct app name
			const loggerOptionsProvider = dynamicModule.providers?.find(
				(provider: any) => provider.provide === 'LOGGER_OPTIONS'
			);
			expect(loggerOptionsProvider).toBeDefined();
			expect(loggerOptionsProvider?.useValue).toEqual({ appName: 'test-app-options' });
		});
	});
}); 