import { Socket } from 'socket.io';
import { AuthUser } from './auth.types';

/**
 * Socket.IO socket with auth context
 */
export interface AuthenticatedSocket extends Socket {
	user?: AuthUser;
}
