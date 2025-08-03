import { verifyToken } from '@clerk/clerk-sdk-node';
import { AppError, ErrorCodes } from '@app/nest/errors';
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
			throw AppError.authentication(ErrorCodes.INVALID_TOKEN);
		}
	}
}
