import { Module } from '@nestjs/common';
import { GrpcClientModule } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME } from '@venta/proto/marketplace/user-management';
import { VENDOR_MANAGEMENT_SERVICE_NAME } from '@venta/proto/marketplace/vendor-management';
import { UploadController } from './controllers/upload/upload.controller';
import { UserController } from './controllers/user/user.controller';
import { VendorController } from './controllers/vendor/vendor.controller';

@Module({
	imports: [
		GrpcClientModule.register([
			{
				name: USER_MANAGEMENT_SERVICE_NAME,
				endpoint: process.env.USER_MANAGEMENT_SERVICE_ENDPOINT || 'localhost:8001',
			},
			{
				name: VENDOR_MANAGEMENT_SERVICE_NAME,
				endpoint: process.env.VENDOR_MANAGEMENT_SERVICE_ENDPOINT || 'localhost:8002',
			},
		]),
	],
	controllers: [UploadController, UserController, VendorController],
	providers: [], // No ACL services needed - using pure functions
})
export class CoreModule {}
