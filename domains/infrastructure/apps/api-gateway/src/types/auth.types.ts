import { Request } from 'express';

export interface AuthedRequest extends Request {
	userId: string;
	roles: string[];
	metadata: Record<string, string>;
}
