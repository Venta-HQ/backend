import { Logger } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AlgoliaSyncModule } from './algolia-sync.module';

async function bootstrap() {
	const app = await NestFactory.create(AlgoliaSyncModule);
	const configService = app.get(ConfigService);

	app.useLogger(app.get(Logger));
	await app.listen(configService.get('ALGOLIA_SYNC_SERVICE_PORT', 5006));
}
bootstrap();
