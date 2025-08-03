export interface Location {
	lat: number;
	long: number;
}

export interface BoundingBox {
	centerLat: number;
	centerLon: number;
	height: number;
	width: number;
}

export class GeospatialUtil {
	/**
	 * Calculate distance between two lat/lon points using Haversine formula
	 * @param lat1 Latitude of first point
	 * @param lon1 Longitude of first point
	 * @param lat2 Latitude of second point
	 * @param lon2 Longitude of second point
	 * @returns Distance in meters
	 */
	static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371000; // Radius of the Earth in meters
		const dLat = (lat2 - lat1) * (Math.PI / 180);
		const dLon = (lon2 - lon1) * (Math.PI / 180);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c; // Distance in meters
	}

	/**
	 * Calculate bounding box dimensions from southwest and northeast coordinates
	 * @param swLocation Southwest corner of bounding box
	 * @param neLocation Northeast corner of bounding box
	 * @returns Bounding box with center coordinates and dimensions
	 */
	static calculateBoundingBoxDimensions(swLocation: Location, neLocation: Location): BoundingBox {
		if (!swLocation || !neLocation) {
			throw new Error('Both southwest and northeast locations are required');
		}

		// Calculate the width (distance between longitudes) and height (distance between latitudes) in meters
		const width = this.calculateDistance(swLocation.lat, swLocation.long, swLocation.lat, neLocation.long);
		const height = this.calculateDistance(swLocation.lat, swLocation.long, neLocation.lat, swLocation.long);

		// Calculate center of the bounding box (average of swLocation and neLocation points)
		const centerLat = (swLocation.lat + neLocation.lat) / 2;
		const centerLon = (swLocation.long + neLocation.long) / 2;

		return {
			centerLat,
			centerLon,
			height,
			width,
		};
	}

	/**
	 * Check if a point is within a bounding box
	 * @param point The point to check
	 * @param swLocation Southwest corner of bounding box
	 * @param neLocation Northeast corner of bounding box
	 * @returns True if point is within bounding box
	 */
	static isPointInBoundingBox(point: Location, swLocation: Location, neLocation: Location): boolean {
		return (
			point.lat >= swLocation.lat &&
			point.lat <= neLocation.lat &&
			point.long >= swLocation.long &&
			point.long <= neLocation.long
		);
	}

	/**
	 * Convert degrees to radians
	 * @param degrees Angle in degrees
	 * @returns Angle in radians
	 */
	static degreesToRadians(degrees: number): number {
		return degrees * (Math.PI / 180);
	}

	/**
	 * Convert radians to degrees
	 * @param radians Angle in radians
	 * @returns Angle in degrees
	 */
	static radiansToDegrees(radians: number): number {
		return radians * (180 / Math.PI);
	}
} 