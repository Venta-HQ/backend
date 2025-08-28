import { Namespace, Server, Socket } from 'socket.io';
import { WebSocketServer } from '@nestjs/websockets';
import type { AuthenticatedSocket } from '@venta/apitypes';
import { Logger, PresenceService } from '@venta/nest/modules';

/**
 * Base WebSocket Gateway providing common functionality and standardized patterns.
 * All WebSocket gateways should extend this class for consistency.
 */
export abstract class BaseWebSocketGateway {
	@WebSocketServer()
	server: Server;

	protected abstract readonly logger: Logger;
	protected readonly presence!: PresenceService;

	/**
	 * Get the entity ID from the authenticated socket user
	 */
	protected getEntityId(client: AuthenticatedSocket): string | null {
		return client.user?.id || null;
	}

	/**
	 * Standardized connection validation and entity ID extraction
	 */
	protected validateConnection(client: AuthenticatedSocket, entityType: string): string | null {
		const entityId = this.getEntityId(client);

		if (!entityId) {
			this.logger.warn(`${entityType} connection attempt without authenticated user`, {
				socketId: client.id,
			});
			client.disconnect(true);
			return null;
		}

		return entityId;
	}

	/**
	 * Standardized error handling for connection lifecycle methods
	 */
	protected handleConnectionError(error: unknown, client: AuthenticatedSocket, operation: string): void {
		this.logger.error(`Failed to ${operation}`, error instanceof Error ? error.stack : undefined, {
			error: error instanceof Error ? error.message : 'Unknown error',
			socketId: client.id,
		});
		// Do not throw; disconnect to avoid crashing the process
		client.disconnect(true);
	}

	/**
	 * Standardized success logging for connections
	 */
	protected logConnectionSuccess(client: AuthenticatedSocket, entityId: string, entityType: string): void {
		this.logger.debug(`${entityType} connected`, {
			socketId: client.id,
			[`${entityType.toLowerCase()}Id`]: entityId,
		});
	}

	/**
	 * Standardized success logging for disconnections
	 */
	protected logDisconnectionSuccess(client: AuthenticatedSocket, entityType: string): void {
		this.logger.debug(`${entityType} disconnected`, {
			socketId: client.id,
		});
	}

	/**
	 * Access the root Socket.IO server regardless of whether this.gateway is a Namespace
	 */
	protected getRootServer(): Server {
		const maybeNamespace = this.server as unknown as Server & { server?: Server };
		return maybeNamespace.server ?? maybeNamespace;
	}

	/**
	 * Resolve a namespace by path from the root server
	 */
	protected getNamespace(path: string): Namespace {
		return this.getRootServer().of(path);
	}

	/**
	 * Standardized connection handling using PresenceService.
	 */
	protected async handleConnectionStandard(
		client: AuthenticatedSocket,
		kind: 'user' | 'vendor',
		onAfter?: (entityId: string) => void | Promise<void>,
	): Promise<string | null> {
		const entityType = kind === 'user' ? 'User' : 'Vendor';
		const entityId = this.validateConnection(client, entityType);
		if (!entityId) return null;

		await this.presence.register(kind, client.id, entityId);
		if (onAfter) await onAfter(entityId);
		this.logConnectionSuccess(client, entityId, entityType);
		return entityId;
	}

	/**
	 * Standardized disconnect handling using PresenceService.
	 */
	protected async handleDisconnectStandard(
		client: Socket,
		kind: 'user' | 'vendor',
		onAfter?: (entityId: string) => void | Promise<void>,
	): Promise<void> {
		const entityId = await this.presence.lookup(kind, client.id);
		if (!entityId) {
			this.logger.warn('Disconnect without presence mapping', { socketId: client.id });
			return;
		}

		await this.presence.disconnect(kind, client.id, entityId);
		if (onAfter) await onAfter(entityId);
		this.logDisconnectionSuccess(client as unknown as AuthenticatedSocket, kind === 'user' ? 'User' : 'Vendor');
	}
}
