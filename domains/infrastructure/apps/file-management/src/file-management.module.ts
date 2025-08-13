import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BootstrapModule } from '@venta/nest/modules';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
        BootstrapModule.forRoot({
            appName: 'file-management',
            domain: 'infrastructure',
            protocol: 'grpc',
        }),
		ConfigModule,
		CoreModule,
	],
})
export class FileManagementModule {}
