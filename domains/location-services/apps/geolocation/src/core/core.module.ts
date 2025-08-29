import { Module } from '@nestjs/common';
import { EventsModule, NatsQueueModule, RedisModule } from '@venta/nest/modules';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';

@Module({
	imports: [RedisModule, EventsModule.register(), NatsQueueModule],
	controllers: [CoreController],
	providers: [CoreService],
	exports: [CoreService],
})
export class CoreModule {}
