import { Module } from '@nestjs/common';
import { APP_NAMES, BootstrapModule } from '@venta/nest/modules';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.GATEWAY,
			domain: 'infrastructure',
			protocol: 'http',
		}),
		UserModule,
		VendorModule,
		UploadModule,
	],
})
export class AppModule {}
