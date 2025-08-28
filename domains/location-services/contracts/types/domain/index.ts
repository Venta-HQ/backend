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

// (Removed) Realtime ACL types - no current usage
