import { Module } from '@nestjs/common';
import { GrpcInstanceModule } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME } from '@venta/proto/marketplace/user-management';
import { VENDOR_MANAGEMENT_SERVICE_NAME } from '@venta/proto/marketplace/vendor-management';
import { UploadController } from './controllers/upload/upload.controller';
import { UserController } from './controllers/user/user.controller';
import { VendorController } from './controllers/vendor/vendor.controller';

@Module({
	imports: [
		// TODO: Update to use proper GrpcInstanceModule configuration
		// This needs to be refactored to match the current module structure
	],
	controllers: [UploadController, UserController, VendorController],
	providers: [], // No ACL services needed - using pure functions
})
export class CoreModule {}
