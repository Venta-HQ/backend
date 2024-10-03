import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestContextService {
	private asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

	set(key: string, value: any) {
		const store = this.asyncLocalStorage.getStore();
		if (store) {
			store.set(key, value);
		}
	}

	get(key: string) {
		const store = this.asyncLocalStorage.getStore();
		return store ? store.get(key) : undefined;
	}

	run(callback: (...args: any[]) => any) {
		this.asyncLocalStorage.run(new Map(), callback);
	}
}
