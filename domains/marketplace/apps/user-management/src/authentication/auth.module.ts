import { Module } from '@nestjs/common';
import { PrismaModule } from '@venta/nest/modules';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
	controllers: [AuthController],
	exports: [AuthService],
	imports: [PrismaModule],
	providers: [AuthService],
})
export class AuthModule {}
