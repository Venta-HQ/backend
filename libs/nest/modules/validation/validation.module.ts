import { Module } from '@nestjs/common';
import { SchemaValidatorPipe } from '@venta/nest/pipes';

@Module({
	providers: [SchemaValidatorPipe],
	exports: [SchemaValidatorPipe],
})
export class ValidationModule {}
