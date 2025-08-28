import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisKeyService {
	private readonly prefix: string;

	constructor(private readonly config: ConfigService) {
		const env = this.config.get<string>('NODE_ENV') || 'development';
		const ns = this.config.get<string>('REDIS_NAMESPACE') || 'locgw';
		this.prefix = `${env}:${ns}:`;
	}

	buildKey(...parts: string[]): string {
		return this.prefix + parts.join(':');
	}
}
