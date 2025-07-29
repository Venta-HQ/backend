import { ClerkModule } from '@app/auth';
import { UploadModule as _UploadModule } from '@app/upload';
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';

@Module({
	controllers: [UploadController],
	imports: [ClerkModule.register(), _UploadModule.register()],
})
export class UploadModule {}
