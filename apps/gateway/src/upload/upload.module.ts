import { UploadModule as _UploadModule, ClerkModule } from 'libs/nest/modules';
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';

@Module({
	controllers: [UploadController],
	imports: [ClerkModule.register(), _UploadModule.register()],
})
export class UploadModule {}
