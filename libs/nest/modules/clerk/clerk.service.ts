import { ClerkClient, createClerkClient } from '@clerk/clerk-sdk-node';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ClerkService {
	private client: ClerkClient;
	private readonly logger = new Logger(ClerkService.name);

	constructor(secretKey: string) {
		this.client = createClerkClient({ secretKey });
	}

	getClient() {
		return this.client;
	}

	async validateRequest(req: Request): Promise<ReturnType<typeof this.client.authenticateRequest>> {
		try {
			return await this.client.authenticateRequest(req);
		} catch (error) {
			throw new Error('Invalid or expired token');
		}
	}
}
