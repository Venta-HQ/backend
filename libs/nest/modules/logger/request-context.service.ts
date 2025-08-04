import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestContextService {
	private readonly context = new Map<string, any>();

	set(key: string, value: any): void {
		this.context.set(key, value);
	}

	get(key: string): any {
		return this.context.get(key);
	}

	clear(): void {
		this.context.clear();
	}
}
