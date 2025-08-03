import { Logger } from '@app/nest/modules/logger';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AlgoliaSyncModule } from './algolia-sync.module';

async function bootstrap() {
	const app = await NestFactory.create(AlgoliaSyncModule);
	const configService = app.get(ConfigService);
	const logger = app.get(Logger);
	await app.listen(configService.get('ALGOLIA_SYNC_SERVICE_PORT', 5006));
	logger.log(`Algolia sync service is running on port ${configService.get('ALGOLIA_SYNC_SERVICE_PORT', 5006)}`, 'Bootstrap', {});
}
bootstrap(); 