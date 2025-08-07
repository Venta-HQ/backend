import { APP_NAMES, BootstrapModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.FILE_MANAGEMENT,
			protocol: 'http',
		}),
		UploadModule,
	],
})
export class FileManagementModule {}
