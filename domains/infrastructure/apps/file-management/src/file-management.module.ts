import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_NAMES, BootstrapModule } from '@venta/nest/modules';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.FILE_MANAGEMENT,
			domain: 'infrastructure',
			protocol: 'grpc',
		}),
		ConfigModule,
		CoreModule,
	],
})
export class FileManagementModule {}
