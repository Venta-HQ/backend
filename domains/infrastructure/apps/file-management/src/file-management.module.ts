import { APP_NAMES, BootstrapModule, CloudinaryModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [CloudinaryModule.register()],
			appName: APP_NAMES.FILE_MANAGEMENT,
			protocol: 'grpc',
		}),
		CoreModule,
	],
})
export class FileManagementModule {}
