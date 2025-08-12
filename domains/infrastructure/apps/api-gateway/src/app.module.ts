import { Module } from '@nestjs/common';
import { APP_NAMES, BootstrapModule } from '@venta/nest/modules';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [CoreModule],
			appName: APP_NAMES.GATEWAY,
			domain: 'infrastructure', // DDD domain for infrastructure services
			protocol: 'http',
		}),
	],
})
export class AppModule {}
