import { Module } from '@nestjs/common';
import { RedisModule } from '@venta/nest/modules';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';

@Module({
	imports: [RedisModule],
	controllers: [CoreController],
	providers: [CoreService],
	exports: [CoreService],
})
export class CoreModule {}
