/**
 * Shared Transformation Utilities
 * 
 * Truly shared transformation logic that can be used across all domains.
 * These utilities are domain-agnostic and don't create cross-domain dependencies.
 */
export class TransformationUtils {
	// ============================================================================
	// Location Transformations (Truly Shared)
	// ============================================================================

	/**
	 * Transform location format (lat/lng to latitude/longitude)
	 */
	static transformLocationToLatLng(location: { lat: number; lng: number }) {
		return {
			latitude: location.lat,
			longitude: location.lng,
		};
	}

	/**
	 * Transform location format (latitude/longitude to lat/lng)
	 */
	static transformLatLngToLocation(location: { latitude: number; longitude: number }) {
		return {
			lat: location.latitude,
			lng: location.longitude,
		};
	}

	/**
	 * Transform bounds format
	 */
	static transformBounds(bounds: {
		northEast: { lat: number; lng: number };
		southWest: { lat: number; lng: number };
	}) {
		return {
			northEast: this.transformLocationToLatLng(bounds.northEast),
			southWest: this.transformLocationToLatLng(bounds.southWest),
		};
	}

	// ============================================================================
	// Data Extraction (Truly Shared)
	// ============================================================================

	/**
	 * Extract value from object with fallback options
	 */
	static extractValue(data: any, keys: string[], fallback: any = null): any {
		for (const key of keys) {
			if (data && data[key] !== undefined) {
				return data[key];
			}
		}
		return fallback;
	}

	/**
	 * Extract string value from object
	 */
	static extractString(data: any, keys: string[], fallback: string = ''): string {
		const value = this.extractValue(data, keys, fallback);
		return typeof value === 'string' ? value : fallback;
	}

	/**
	 * Extract number value from object
	 */
	static extractNumber(data: any, keys: string[], fallback: number = 0): number {
		const value = this.extractValue(data, keys, fallback);
		return typeof value === 'number' ? value : fallback;
	}

	/**
	 * Extract object value from object
	 */
	static extractObject(data: any, keys: string[], fallback: Record<string, any> = {}): Record<string, any> {
		const value = this.extractValue(data, keys, fallback);
		return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
	}
} 