// Types
export interface GeoPoint {
	lat: number;
	lng: number;
}

// Constants
const EARTH_RADIUS_METERS = 6_371_000; // mean Earth radius in meters

// Math helpers
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const normalizeLng = (lng: number): number => {
	let result = ((lng + 180) % 360) - 180;
	if (result === -180) result = 180;
	return result;
};
const normalizedDeltaLng = (fromLng: number, toLng: number): number => normalizeLng(toLng - fromLng);

// Distances
const haversineDistanceMeters = (a: GeoPoint, b: GeoPoint): number => {
	const phi1 = toRadians(a.lat);
	const phi2 = toRadians(b.lat);
	const deltaPhi = toRadians(b.lat - a.lat);
	const deltaLambda = toRadians(normalizedDeltaLng(a.lng, b.lng));

	const sinDeltaPhi = Math.sin(deltaPhi / 2);
	const sinDeltaLambda = Math.sin(deltaLambda / 2);
	const h = sinDeltaPhi * sinDeltaPhi + Math.cos(phi1) * Math.cos(phi2) * sinDeltaLambda * sinDeltaLambda;
	const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
	return EARTH_RADIUS_METERS * c;
};

// Bounding utilities
const computeBoundsCenter = (ne: GeoPoint, sw: GeoPoint): GeoPoint => {
	const midLat = (ne.lat + sw.lat) / 2;
	const deltaLng = normalizedDeltaLng(sw.lng, ne.lng);
	const midLng = normalizeLng(sw.lng + deltaLng / 2);
	return { lat: midLat, lng: midLng };
};

const computeBoundsRadiusMeters = (ne: GeoPoint, sw: GeoPoint): number => {
	const diagonal = haversineDistanceMeters(sw, ne);
	return diagonal / 2;
};

export const computeBoundingCircleFromBounds = (
	ne: GeoPoint,
	sw: GeoPoint,
): { center: GeoPoint; radiusMeters: number } => ({
	center: computeBoundsCenter(ne, sw),
	radiusMeters: computeBoundsRadiusMeters(ne, sw),
});
