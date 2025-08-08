import { ValidationUtils } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Location Services External Service Anti-Corruption Layer
 *
 * Protects location services from external service changes
 */
@Injectable()
export class LocationExternalServiceACL {
	private readonly logger = new Logger('LocationExternalServiceACL');

	/**
	 * Validate geocoding response
	 */
	private validateGeocodingResponse(data: any): boolean {
		return (
			data &&
			data.status === 'OK' &&
			Array.isArray(data.results) &&
			data.results.length > 0 &&
			data.results[0].formatted_address &&
			data.results[0].geometry?.location?.lat !== undefined &&
			data.results[0].geometry?.location?.lng !== undefined
		);
	}

	/**
	 * Validate reverse geocoding response
	 */
	private validateReverseGeocodingResponse(data: any): boolean {
		return (
			data &&
			data.status === 'OK' &&
			Array.isArray(data.results) &&
			data.results.length > 0 &&
			data.results[0].formatted_address &&
			Array.isArray(data.results[0].address_components)
		);
	}

	/**
	 * Validate distance response
	 */
	private validateDistanceResponse(data: any): boolean {
		return (
			data &&
			data.status === 'OK' &&
			Array.isArray(data.rows) &&
			data.rows.length > 0 &&
			Array.isArray(data.rows[0].elements) &&
			data.rows[0].elements.length > 0 &&
			data.rows[0].elements[0].distance?.value !== undefined &&
			data.rows[0].elements[0].duration?.value !== undefined
		);
	}

	/**
	 * Translate external geocoding service response to location services format
	 */
	toLocationServicesGeocodingResult(externalResponse: {
		results: Array<{
			formatted_address: string;
			geometry: {
				location: {
					lat: number;
					lng: number;
				};
			};
			place_id: string;
		}>;
		status: string;
	}) {
		try {
			// Validate external data
			if (!this.validateGeocodingResponse(externalResponse)) {
				throw new Error('Invalid geocoding response data');
			}

			const firstResult = externalResponse.results[0];
			const locationServicesResult = {
				address: firstResult.formatted_address,
				coordinates: {
					latitude: firstResult.geometry.location.lat,
					longitude: firstResult.geometry.location.lng,
				},
				placeId: firstResult.place_id,
				timestamp: new Date().toISOString(),
			};

			return locationServicesResult;
		} catch (error) {
			this.logger.error('Failed to translate geocoding result', error);
			throw error;
		}
	}

	/**
	 * Translate external reverse geocoding service response to location services format
	 */
	toLocationServicesReverseGeocodingResult(externalResponse: {
		results: Array<{
			formatted_address: string;
			address_components: Array<{
				long_name: string;
				short_name: string;
				types: string[];
			}>;
			place_id: string;
		}>;
		status: string;
	}) {
		try {
			// Validate external data
			if (!this.validateReverseGeocodingResponse(externalResponse)) {
				throw new Error('Invalid reverse geocoding response data');
			}

			const firstResult = externalResponse.results[0];
			const locationServicesResult = {
				address: firstResult.formatted_address,
				placeId: firstResult.place_id,
				components: this.extractAddressComponents(firstResult.address_components),
				timestamp: new Date().toISOString(),
			};

			return locationServicesResult;
		} catch (error) {
			this.logger.error('Failed to translate reverse geocoding result', error);
			throw error;
		}
	}

	/**
	 * Translate external distance calculation service response to location services format
	 */
	toLocationServicesDistanceResult(externalResponse: {
		rows: Array<{
			elements: Array<{
				distance: {
					text: string;
					value: number;
				};
				duration: {
					text: string;
					value: number;
				};
				status: string;
			}>;
		}>;
		status: string;
	}) {
		try {
			// Validate external data
			if (!this.validateDistanceResponse(externalResponse)) {
				throw new Error('Invalid distance response data');
			}

			const firstElement = externalResponse.rows[0].elements[0];
			const locationServicesResult = {
				distance: {
					text: firstElement.distance.text,
					meters: firstElement.distance.value,
				},
				duration: {
					text: firstElement.duration.text,
					seconds: firstElement.duration.value,
				},
				timestamp: new Date().toISOString(),
			};

			return locationServicesResult;
		} catch (error) {
			this.logger.error('Failed to translate distance result', error);
			throw error;
		}
	}

	/**
	 * Translate location services geocoding request to external service format
	 */
	toExternalGeocodingRequest(
		address: string,
		options?: {
			country?: string;
			language?: string;
		},
	) {
		try {
			// Validate input
			if (!address || typeof address !== 'string') {
				throw new Error('Invalid geocoding request data');
			}

			const externalRequest = {
				address,
				components: options?.country ? `country:${options.country}` : undefined,
				language: options?.language || 'en',
			};

			return externalRequest;
		} catch (error) {
			this.logger.error('Failed to translate geocoding request', error);
			throw error;
		}
	}

	// ============================================================================
	// PRIVATE HELPER METHODS
	// ============================================================================

	private extractAddressComponents(components: Array<{ long_name: string; short_name: string; types: string[] }>) {
		const extracted: Record<string, string> = {};

		for (const component of components) {
			for (const type of component.types) {
				switch (type) {
					case 'street_number':
						extracted.streetNumber = component.long_name;
						break;
					case 'route':
						extracted.street = component.long_name;
						break;
					case 'locality':
						extracted.city = component.long_name;
						break;
					case 'administrative_area_level_1':
						extracted.state = component.long_name;
						break;
					case 'country':
						extracted.country = component.long_name;
						break;
					case 'postal_code':
						extracted.postalCode = component.long_name;
						break;
				}
			}
		}

		return extracted;
	}

	// ============================================================================
	// ABSTRACT METHOD IMPLEMENTATIONS
	// ============================================================================

	validateExternalData(data: any): boolean {
		if (!data) {
			throw this.createValidationError('External data is required', { data });
		}

		// Additional validation based on data structure
		if (data.status && typeof data.status !== 'string') {
			throw this.createValidationError('Invalid status type', { data });
		}

		return true;
	}

	validateLocationServicesData(data: any): boolean {
		if (!data) {
			throw this.createValidationError('Location services data is required', { data });
		}

		// Additional validation based on data structure
		if (
			data.coordinates &&
			(typeof data.coordinates.latitude !== 'number' || typeof data.coordinates.longitude !== 'number')
		) {
			throw this.createValidationError('Invalid coordinates format', { data });
		}

		return true;
	}
}
