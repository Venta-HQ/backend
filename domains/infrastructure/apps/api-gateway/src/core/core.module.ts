import { Module } from '@nestjs/common';
import { UserHttpACL } from '@venta/domains/infrastructure/contracts/anti-corruption-layers/user-http.acl';
import { VendorHttpACL } from '@venta/domains/infrastructure/contracts/anti-corruption-layers/vendor-http.acl';
import { UploadController } from './controllers/upload/upload.controller';
import { UserController } from './controllers/user/user.controller';
import { VendorController } from './controllers/vendor/vendor.controller';

@Module({
	controllers: [UploadController, UserController, VendorController],
	providers: [UserHttpACL, VendorHttpACL],
})
export class CoreModule {}
