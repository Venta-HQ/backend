import { verifyToken } from '@clerk/clerk-sdk-node';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ClerkService {
	private readonly logger = new Logger(ClerkService.name);
	private secretKey: string;
	constructor(secretKey: string) {
		this.secretKey = secretKey;
	}

	async verifyToken(token: string): Promise<ReturnType<typeof verifyToken>> {
		try {
			return await verifyToken(token, {
				secretKey: this.secretKey,
			});
		} catch (error) {
			throw new Error('Invalid or expired token');
		}
	}
}
