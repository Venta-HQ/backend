import { Injectable } from '@nestjs/common';
import { BaseAntiCorruptionLayer } from '@app/nest/modules/contracts';

/**
 * Location Services External Service Anti-Corruption Layer
 * 
 * Protects location services from external service changes
 */
@Injectable()
export class LocationExternalServiceACL extends BaseAntiCorruptionLayer {
	constructor() {
		super('LocationExternalServiceACL');
	}

	getExternalService(): string {
		return 'location-external-services';
	}

	getDomain(): string {
		return 'location-services';
	}

	/**
	 * Translate external geocoding service response to location services format
	 */
	toLocationServicesGeocodingResult(
		externalResponse: {
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
		},
	) {
		this.logTranslationStart('toLocationServicesGeocodingResult', { status: externalResponse.status });

		try {
			// Validate external data
			this.validateExternalData(externalResponse);

			if (externalResponse.status !== 'OK' || !externalResponse.results?.length) {
				throw this.createExtractionError('No geocoding results found', { externalResponse });
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

			// Validate location services data
			this.validateLocationServicesData(locationServicesResult);

			this.logTranslationSuccess('toLocationServicesGeocodingResult', { placeId: firstResult.place_id });
			return locationServicesResult;
		} catch (error) {
			this.logTranslationError('toLocationServicesGeocodingResult', error, { status: externalResponse.status });
			throw error;
		}
	}

	/**
	 * Translate external reverse geocoding service response to location services format
	 */
	toLocationServicesReverseGeocodingResult(
		externalResponse: {
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
		},
	) {
		this.logTranslationStart('toLocationServicesReverseGeocodingResult', { status: externalResponse.status });

		try {
			// Validate external data
			this.validateExternalData(externalResponse);

			if (externalResponse.status !== 'OK' || !externalResponse.results?.length) {
				throw this.createExtractionError('No reverse geocoding results found', { externalResponse });
			}

			const firstResult = externalResponse.results[0];
			const locationServicesResult = {
				address: firstResult.formatted_address,
				placeId: firstResult.place_id,
				components: this.extractAddressComponents(firstResult.address_components),
				timestamp: new Date().toISOString(),
			};

			// Validate location services data
			this.validateLocationServicesData(locationServicesResult);

			this.logTranslationSuccess('toLocationServicesReverseGeocodingResult', { placeId: firstResult.place_id });
			return locationServicesResult;
		} catch (error) {
			this.logTranslationError('toLocationServicesReverseGeocodingResult', error, { status: externalResponse.status });
			throw error;
		}
	}

	/**
	 * Translate external distance calculation service response to location services format
	 */
	toLocationServicesDistanceResult(
		externalResponse: {
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
		},
	) {
		this.logTranslationStart('toLocationServicesDistanceResult', { status: externalResponse.status });

		try {
			// Validate external data
			this.validateExternalData(externalResponse);

			if (externalResponse.status !== 'OK' || !externalResponse.rows?.length) {
				throw this.createExtractionError('No distance calculation results found', { externalResponse });
			}

			const firstElement = externalResponse.rows[0].elements[0];
			if (firstElement.status !== 'OK') {
				throw this.createExtractionError('Distance calculation failed', { element: firstElement });
			}

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

			// Validate location services data
			this.validateLocationServicesData(locationServicesResult);

			this.logTranslationSuccess('toLocationServicesDistanceResult', { distance: firstElement.distance.text });
			return locationServicesResult;
		} catch (error) {
			this.logTranslationError('toLocationServicesDistanceResult', error, { status: externalResponse.status });
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
		this.logTranslationStart('toExternalGeocodingRequest', { address });

		try {
			// Validate location services data
			this.validateLocationServicesData({ address, options });

			const externalRequest = {
				address,
				components: options?.country ? `country:${options.country}` : undefined,
				language: options?.language || 'en',
			};

			// Validate external data
			this.validateExternalData(externalRequest);

			this.logTranslationSuccess('toExternalGeocodingRequest', { address });
			return externalRequest;
		} catch (error) {
			this.logTranslationError('toExternalGeocodingRequest', error, { address });
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
		if (data.coordinates && (typeof data.coordinates.latitude !== 'number' || typeof data.coordinates.longitude !== 'number')) {
			throw this.createValidationError('Invalid coordinates format', { data });
		}

		return true;
	}
} 