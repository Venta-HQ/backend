import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

@Module({})
export class CloudinaryModule {
	static register(): DynamicModule {
		return {
			exports: [CloudinaryService],
			imports: [ConfigModule],
			module: CloudinaryModule,
			providers: [CloudinaryService],
		};
	}
}
