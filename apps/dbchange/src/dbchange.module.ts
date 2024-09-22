import { AlgoliaModule, LoggerModule, PrismaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VendorService } from './models/vendor.service';

@Module({
	controllers: [],
	imports: [
		ConfigModule.forRoot(),
		LoggerModule.register('DB Change Microservice'),
		AlgoliaModule.register(),
		PrismaModule.register(),
	],
	providers: [VendorService],
})
export class DbchangeModule {}
