import { NestFactory } from '@nestjs/core';
import { FileManagementModule } from './file-management.module';

async function bootstrap() {
	const app = await NestFactory.create(FileManagementModule);
	await app.listen(process.env.PORT || 3005);
}
bootstrap();
