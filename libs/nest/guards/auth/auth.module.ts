import { Module } from '@nestjs/common';
import { InfraModule } from '@venta/nest/modules/infra';
import { RequestContextModule } from '@venta/nest/modules/networking/request-context';
import { AuthService } from './auth.service';
import { HttpAuthGuard } from './http.guard';

@Module({
	imports: [InfraModule, RequestContextModule],
	providers: [AuthService, HttpAuthGuard],
	exports: [AuthService, HttpAuthGuard],
})
export class AuthModule {}
