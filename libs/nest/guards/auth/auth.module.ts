import { Module } from '@nestjs/common';
import { LoggerModule } from '@venta/nest/modules/core/logger';
import { RequestContextModule } from '@venta/nest/modules/networking/request-context';
import { AuthService } from './auth.service';
import { HttpAuthGuard } from './http.guard';
import { WsAuthGuard } from './ws.guard';

@Module({
	imports: [RequestContextModule, LoggerModule.register()],
	providers: [AuthService, HttpAuthGuard, WsAuthGuard],
	exports: [AuthService, HttpAuthGuard, WsAuthGuard],
})
export class AuthModule {}
