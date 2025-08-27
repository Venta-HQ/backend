import { describe, expect, it } from 'vitest';
import { computeBoundingCircleFromBounds } from './location.util';

describe('location.util', () => {
	it('computeBoundingCircleFromBounds returns center and radius for simple bounds', () => {
		const ne = { lat: 2, lng: 2 };
		const sw = { lat: 0, lng: 0 };
		const { center, radiusMeters } = computeBoundingCircleFromBounds(ne, sw);
		expect(center.lat).toBe(1);
		expect(center.lng).toBe(1);
		expect(radiusMeters).toBeGreaterThan(0);
	});

	it('computeBoundingCircleFromBounds handles antimeridian crossing', () => {
		const ne = { lat: 10, lng: -170 };
		const sw = { lat: 0, lng: 170 };
		const { center } = computeBoundingCircleFromBounds(ne, sw);
		expect(center.lat).toBe(5);
		// center longitude should be near 180/-180 boundary
		expect(Math.abs(Math.abs(center.lng) - 180)).toBeLessThanOrEqual(5);
	});
});
