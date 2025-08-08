/**
 * Utility class for transforming data between different formats
 */
export class TransformationUtil {
	/**
	 * Transform location format (lat/long to latitude/longitude)
	 */
	static transformLocationToLatLong(location: { lat: number; long: number }) {
		return {
			latitude: location.lat,
			longitude: location.long,
		};
	}

	/**
	 * Transform location format (latitude/longitude to lat/long)
	 */
	static transformLocationFromLatLong(location: { latitude: number; longitude: number }) {
		return {
			lat: location.latitude,
			long: location.longitude,
		};
	}

	/**
	 * Transform geospatial bounds format
	 */
	static transformBounds(bounds: {
		northEast: { lat: number; long: number };
		southWest: { lat: number; long: number };
	}) {
		return {
			ne: {
				lat: bounds.northEast.lat,
				long: bounds.northEast.long,
			},
			sw: {
				lat: bounds.southWest.lat,
				long: bounds.southWest.long,
			},
		};
	}
}
