import { Module } from '@nestjs/common';
import { SchemaValidatorPipe } from '@venta/nest/pipes/schema-validator';

@Module({
    providers: [SchemaValidatorPipe],
    exports: [SchemaValidatorPipe],
})
export class ValidationModule {}


