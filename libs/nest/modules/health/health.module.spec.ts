import { HealthModule } from './health.module';

describe('HealthModule', () => {
	it('should create HealthModule with forRoot', () => {
		const healthModule = HealthModule.forRoot({
			serviceName: 'test-service',
		});
		expect(healthModule).toBeDefined();
		expect(healthModule.module).toBe(HealthModule);
		expect(healthModule.controllers).toContain(require('./health.controller').HealthController);
		expect(healthModule.providers).toHaveLength(1);
		expect(healthModule.providers[0]).toHaveProperty('provide', 'HEALTH_OPTIONS');
	});
}); 