import { Module } from '@nestjs/common';
import { BootstrapModule, PrismaModule } from '@venta/nest/modules';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'user-management',
			domain: 'marketplace',
			protocol: 'grpc',
		}),
		PrismaModule,
	],
	controllers: [CoreController],
	providers: [CoreService],
	exports: [CoreService],
})
export class CoreModule {}
