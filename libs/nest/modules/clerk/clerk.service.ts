import { verifyToken } from '@clerk/clerk-sdk-node';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClerkService {
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
