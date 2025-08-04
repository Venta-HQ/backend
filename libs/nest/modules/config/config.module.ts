import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configSchema } from './config.schema';

function validateConfig(config: Record<string, any>) {
	const result = configSchema.safeParse(config);
	if (!result.success) {
		throw new Error('Invalid environment variables: ' + JSON.stringify(result.error.format(), null, 2));
	}
	return result.data;
}

@Global()
@Module({
	exports: [NestConfigModule],
	imports: [
		NestConfigModule.forRoot({
			isGlobal: true,
			validate: validateConfig,
		}),
	],
})
export class ConfigModule {} 