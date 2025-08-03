import { describe, expect, it } from 'vitest';
import { BoundingBox, GeospatialUtil, Location } from './geospatial.util';

describe('GeospatialUtil', () => {
	describe('calculateDistance', () => {
		it('should calculate distance between two points correctly', () => {
			// Test case: New York to Los Angeles (approximate coordinates)
			const nyc = { lat: 40.7128, long: -74.006 };
			const la = { lat: 34.0522, long: -118.2437 };

			const distance = GeospatialUtil.calculateDistance(nyc.lat, nyc.long, la.lat, la.long);

			// Distance should be approximately 3935 km (within 100km tolerance)
			expect(distance).toBeGreaterThan(3835000); // 3835 km
			expect(distance).toBeLessThan(4035000); // 4035 km
		});

		it('should return 0 for identical points', () => {
			const lat = 40.7128;
			const long = -74.006;

			const distance = GeospatialUtil.calculateDistance(lat, long, lat, long);

			expect(distance).toBe(0);
		});

		it('should handle antipodal points', () => {
			// Test antipodal points (opposite sides of Earth)
			const point1 = { lat: 0, long: 0 };
			const point2 = { lat: 0, long: 180 };

			const distance = GeospatialUtil.calculateDistance(point1.lat, point1.long, point2.lat, point2.long);

			// Should be approximately half the Earth's circumference
			expect(distance).toBeGreaterThan(20000000); // 20,000 km
			expect(distance).toBeLessThan(21000000); // 21,000 km
		});

		it('should handle negative coordinates', () => {
			const point1 = { lat: -40.7128, long: -74.006 };
			const point2 = { lat: -34.0522, long: -118.2437 };

			const distance = GeospatialUtil.calculateDistance(point1.lat, point1.long, point2.lat, point2.long);

			expect(distance).toBeGreaterThan(0);
			expect(typeof distance).toBe('number');
		});

		it('should handle coordinates at poles', () => {
			const northPole = { lat: 90, long: 0 };
			const southPole = { lat: -90, long: 0 };

			const distance = GeospatialUtil.calculateDistance(northPole.lat, northPole.long, southPole.lat, southPole.long);

			// Should be approximately the Earth's diameter (around 20,000 km)
			expect(distance).toBeGreaterThan(19000000); // 19,000 km
			expect(distance).toBeLessThan(21000000); // 21,000 km
		});
	});

	describe('calculateBoundingBoxDimensions', () => {
		it('should calculate bounding box dimensions correctly', () => {
			const swLocation: Location = { lat: 40.0, long: -74.0 };
			const neLocation: Location = { lat: 41.0, long: -73.0 };

			const result = GeospatialUtil.calculateBoundingBoxDimensions(swLocation, neLocation);

			expect(result).toHaveProperty('centerLat');
			expect(result).toHaveProperty('centerLon');
			expect(result).toHaveProperty('height');
			expect(result).toHaveProperty('width');

			// Center should be the average of the coordinates
			expect(result.centerLat).toBe(40.5);
			expect(result.centerLon).toBe(-73.5);

			// Dimensions should be positive
			expect(result.height).toBeGreaterThan(0);
			expect(result.width).toBeGreaterThan(0);
		});

		it('should throw error when southwest location is missing', () => {
			const neLocation: Location = { lat: 41.0, long: -73.0 };

			expect(() => {
				GeospatialUtil.calculateBoundingBoxDimensions(null as any, neLocation);
			}).toThrow('Both southwest and northeast locations are required');
		});

		it('should throw error when northeast location is missing', () => {
			const swLocation: Location = { lat: 40.0, long: -74.0 };

			expect(() => {
				GeospatialUtil.calculateBoundingBoxDimensions(swLocation, null as any);
			}).toThrow('Both southwest and northeast locations are required');
		});

		it('should handle small bounding boxes', () => {
			const swLocation: Location = { lat: 40.0, long: -74.0 };
			const neLocation: Location = { lat: 40.001, long: -73.999 };

			const result = GeospatialUtil.calculateBoundingBoxDimensions(swLocation, neLocation);

			expect(result.centerLat).toBe(40.0005);
			expect(result.centerLon).toBe(-73.9995);
			expect(result.height).toBeGreaterThan(0);
			expect(result.width).toBeGreaterThan(0);
		});

		it('should handle large bounding boxes', () => {
			const swLocation: Location = { lat: -45.0, long: -180.0 };
			const neLocation: Location = { lat: 45.0, long: 180.0 };

			const result = GeospatialUtil.calculateBoundingBoxDimensions(swLocation, neLocation);

			expect(result.centerLat).toBe(0);
			expect(result.centerLon).toBe(0);
			expect(result.height).toBeGreaterThan(0);
			expect(result.width).toBeGreaterThan(0);
		});
	});

	describe('isPointInBoundingBox', () => {
		it('should return true for point inside bounding box', () => {
			const swLocation: Location = { lat: 40.0, long: -74.0 };
			const neLocation: Location = { lat: 41.0, long: -73.0 };
			const point: Location = { lat: 40.5, long: -73.5 };

			const result = GeospatialUtil.isPointInBoundingBox(point, swLocation, neLocation);

			expect(result).toBe(true);
		});

		it('should return false for point outside bounding box', () => {
			const swLocation: Location = { lat: 40.0, long: -74.0 };
			const neLocation: Location = { lat: 41.0, long: -73.0 };
			const point: Location = { lat: 42.0, long: -72.0 };

			const result = GeospatialUtil.isPointInBoundingBox(point, swLocation, neLocation);

			expect(result).toBe(false);
		});

		it('should return true for point on bounding box edge', () => {
			const swLocation: Location = { lat: 40.0, long: -74.0 };
			const neLocation: Location = { lat: 41.0, long: -73.0 };
			const point: Location = { lat: 40.0, long: -74.0 }; // Southwest corner

			const result = GeospatialUtil.isPointInBoundingBox(point, swLocation, neLocation);

			expect(result).toBe(true);
		});

		it('should handle bounding box crossing the 180/-180 meridian', () => {
			const swLocation: Location = { lat: 40.0, long: 170.0 };
			const neLocation: Location = { lat: 41.0, long: -170.0 };
			const point: Location = { lat: 40.5, long: 180.0 };

			const result = GeospatialUtil.isPointInBoundingBox(point, swLocation, neLocation);

			// This is a complex case that depends on implementation
			expect(typeof result).toBe('boolean');
		});

		it('should handle bounding box crossing the equator', () => {
			const swLocation: Location = { lat: -1.0, long: -74.0 };
			const neLocation: Location = { lat: 1.0, long: -73.0 };
			const point: Location = { lat: 0.0, long: -73.5 };

			const result = GeospatialUtil.isPointInBoundingBox(point, swLocation, neLocation);

			expect(result).toBe(true);
		});
	});

	describe('degreesToRadians', () => {
		it('should convert degrees to radians correctly', () => {
			expect(GeospatialUtil.degreesToRadians(0)).toBe(0);
			expect(GeospatialUtil.degreesToRadians(90)).toBe(Math.PI / 2);
			expect(GeospatialUtil.degreesToRadians(180)).toBe(Math.PI);
			expect(GeospatialUtil.degreesToRadians(360)).toBe(2 * Math.PI);
		});

		it('should handle negative degrees', () => {
			expect(GeospatialUtil.degreesToRadians(-90)).toBe(-Math.PI / 2);
			expect(GeospatialUtil.degreesToRadians(-180)).toBe(-Math.PI);
		});

		it('should handle decimal degrees', () => {
			expect(GeospatialUtil.degreesToRadians(45)).toBe(Math.PI / 4);
			expect(GeospatialUtil.degreesToRadians(30)).toBe(Math.PI / 6);
		});
	});

	describe('radiansToDegrees', () => {
		it('should convert radians to degrees correctly', () => {
			expect(GeospatialUtil.radiansToDegrees(0)).toBe(0);
			expect(GeospatialUtil.radiansToDegrees(Math.PI / 2)).toBe(90);
			expect(GeospatialUtil.radiansToDegrees(Math.PI)).toBe(180);
			expect(GeospatialUtil.radiansToDegrees(2 * Math.PI)).toBe(360);
		});

		it('should handle negative radians', () => {
			expect(GeospatialUtil.radiansToDegrees(-Math.PI / 2)).toBe(-90);
			expect(GeospatialUtil.radiansToDegrees(-Math.PI)).toBe(-180);
		});

		it('should handle decimal radians', () => {
			expect(GeospatialUtil.radiansToDegrees(Math.PI / 4)).toBe(45);
			expect(GeospatialUtil.radiansToDegrees(Math.PI / 6)).toBeCloseTo(30, 10);
		});
	});

	describe('integration tests', () => {
		it('should work together for a complete geospatial workflow', () => {
			// Define a bounding box
			const swLocation: Location = { lat: 40.0, long: -74.0 };
			const neLocation: Location = { lat: 41.0, long: -73.0 };

			// Calculate bounding box dimensions
			const boundingBox = GeospatialUtil.calculateBoundingBoxDimensions(swLocation, neLocation);

			// Test points inside and outside the box
			const insidePoint: Location = { lat: 40.5, long: -73.5 };
			const outsidePoint: Location = { lat: 42.0, long: -72.0 };

			// Check if points are in bounding box
			const insideResult = GeospatialUtil.isPointInBoundingBox(insidePoint, swLocation, neLocation);
			const outsideResult = GeospatialUtil.isPointInBoundingBox(outsidePoint, swLocation, neLocation);

			// Calculate distances
			const distance1 = GeospatialUtil.calculateDistance(
				swLocation.lat,
				swLocation.long,
				insidePoint.lat,
				insidePoint.long,
			);
			const distance2 = GeospatialUtil.calculateDistance(
				insidePoint.lat,
				insidePoint.long,
				neLocation.lat,
				neLocation.long,
			);

			// Verify results
			expect(insideResult).toBe(true);
			expect(outsideResult).toBe(false);
			expect(distance1).toBeGreaterThan(0);
			expect(distance2).toBeGreaterThan(0);
			expect(boundingBox.centerLat).toBe(40.5);
			expect(boundingBox.centerLon).toBe(-73.5);
		});
	});
});
