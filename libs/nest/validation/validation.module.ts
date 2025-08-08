import { Module } from '@nestjs/common';
import { SchemaValidatorPipe } from '../pipes/schema-validator/schema-validator.pipe';

@Module({
	providers: [SchemaValidatorPipe],
	exports: [SchemaValidatorPipe],
})
export class ValidationModule {}
