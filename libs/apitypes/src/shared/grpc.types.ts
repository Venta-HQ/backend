import { AuthUser } from './auth.types';

export interface GrpcRequestMetadata {
	user?: AuthUser;
	requestId?: string;
}
