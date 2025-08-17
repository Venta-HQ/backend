/**
 * Utility class for transforming data between different formats
 */
export class TransformationUtil {
	/**
	 * Transform location format (lat/long to latitude/longitude)
	 */
	static transformLocationToLatLng(location: { lat: number; lng: number }) {
		return {
			latitude: location.lat,
			longitude: location.lng,
		};
	}

	/**
	 * Transform location format (latitude/longitude to lat/long)
	 */
	static transformLocationFromLatLng(location: { latitude: number; longitude: number }) {
		return {
			lat: location.latitude,
			lng: location.longitude,
		};
	}

	/**
	 * Transform geospatial bounds format
	 */
	static transformBounds(bounds: { northEast: { lat: number; lng: number }; southWest: { lat: number; lng: number } }) {
		return {
			ne: {
				lat: bounds.northEast.lat,
				lng: bounds.northEast.lng,
			},
			sw: {
				lat: bounds.southWest.lat,
				lng: bounds.southWest.lng,
			},
		};
	}
}
