/**
 * Domain types for location services
 * These represent clean domain entities used within the location services domain
 */

export interface LocationUpdate {
	entityId: string;
	coordinates: {
		lat: number;
		lng: number;
	};
}

export interface GeospatialQuery {
	ne: {
		lat: number;
		lng: number;
	};
	sw: {
		lat: number;
		lng: number;
	};
}

export interface LocationResult {
	entityId: string;
	coordinates: {
		lat: number;
		lng: number;
	};
	distance?: number;
}

// Re-export realtime types that are still in the ACL
export type { RealtimeMessage, WebSocketConnection, NatsSubscriptionOptions } from '../../acl/realtime.acl';
