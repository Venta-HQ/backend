import { Module } from '@nestjs/common';
import { EventService, PrismaModule } from '@venta/nest/modules';
import { LocationModule } from '../location/location.module';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';

@Module({
	imports: [PrismaModule, LocationModule],
	controllers: [CoreController],
	providers: [CoreService, EventService],
	exports: [CoreService],
})
export class CoreModule {}
