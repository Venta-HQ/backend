import { Module } from '@nestjs/common';
import { CloudinaryService } from '@venta/nest/modules';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';

@Module({
	controllers: [CoreController],
	providers: [CoreService, CloudinaryService],
})
export class CoreModule {}
