/**
 * Domain types for location services
 * These represent clean domain entities used within the location services domain
 */

export interface LocationUpdate {
	entityId: string;
	entityType: 'user' | 'vendor';
	coordinates: {
		lat: number;
		lng: number;
	};
	timestamp: string;
}

export interface GeospatialQuery {
	entityType: 'user' | 'vendor';
	center: {
		lat: number;
		lng: number;
	};
	radius: number; // in meters
}

export interface LocationResult {
	entityId: string;
	entityType: 'user' | 'vendor';
	coordinates: {
		lat: number;
		lng: number;
	};
	distance?: number;
	lastUpdated: string;
}

// Re-export realtime types that are still in the ACL
export type { RealtimeMessage, WebSocketConnection, NatsSubscriptionOptions } from '../../acl/realtime.acl';
