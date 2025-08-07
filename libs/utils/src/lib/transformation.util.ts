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

	// ============================================================================
	// Common Data Extraction Patterns (Truly Shared)
	// ============================================================================

	/**
	 * Extract user ID from various external service formats
	 */
	static extractUserId(data: any, fallback: string = ''): string {
		return this.extractString(data, ['app_user_id', 'user_id', 'id', 'userId'], fallback);
	}

	/**
	 * Extract email from various external service formats
	 */
	static extractEmail(data: any, fallback: string = ''): string {
		return this.extractString(data, [
			'emailAddresses.0.emailAddress',
			'email_addresses.0.email_address',
			'primaryEmailAddress.emailAddress',
			'primary_email_address.email_address',
			'email',
		], fallback);
	}

	/**
	 * Extract product ID from various external service formats
	 */
	static extractProductId(data: any, fallback: string = ''): string {
		return this.extractString(data, ['product_id', 'productId'], fallback);
	}

	/**
	 * Extract status from various external service formats
	 */
	static extractStatus(data: any, fallback: string = 'unknown'): string {
		return this.extractString(data, ['status', 'subscription_status'], fallback);
	}

	/**
	 * Extract transaction ID from various external service formats
	 */
	static extractTransactionId(data: any, fallback: string = ''): string {
		return this.extractString(data, ['transaction_id', 'transactionId'], fallback);
	}

	/**
	 * Extract original transaction ID from various external service formats
	 */
	static extractOriginalTransactionId(data: any, fallback: string = ''): string {
		return this.extractString(data, ['original_transaction_id', 'originalTransactionId'], fallback);
	}

	/**
	 * Extract created timestamp from various external service formats
	 */
	static extractCreatedAt(data: any, fallback?: string): string {
		return this.extractString(data, ['created_at', 'createdAt'], fallback || new Date().toISOString());
	}

	/**
	 * Extract updated timestamp from various external service formats
	 */
	static extractUpdatedAt(data: any, fallback?: string): string {
		return this.extractString(data, ['updated_at', 'updatedAt'], fallback || new Date().toISOString());
	}

	/**
	 * Extract purchase date from various external service formats
	 */
	static extractPurchaseDate(data: any, fallback?: string): string {
		return this.extractString(data, ['purchase_date', 'purchaseDate', 'created_at'], fallback || new Date().toISOString());
	}

	/**
	 * Extract expiration date from various external service formats
	 */
	static extractExpirationDate(data: any, fallback: string = ''): string {
		return this.extractString(data, ['expiration_date', 'expirationDate', 'expires_at'], fallback);
	}

	/**
	 * Extract metadata from various external service formats
	 */
	static extractMetadata(data: any, fallback: Record<string, any> = {}): Record<string, any> {
		return this.extractObject(data, ['metadata', 'attributes', 'publicMetadata', 'public_metadata'], fallback);
	}

	/**
	 * Extract platform from various external service formats
	 */
	static extractPlatform(data: any, fallback: string = 'unknown'): string {
		return this.extractString(data, ['platform', 'store'], fallback);
	}

	/**
	 * Extract environment from various external service formats
	 */
	static extractEnvironment(data: any, fallback: string = 'production'): string {
		return this.extractString(data, ['environment'], fallback);
	}

	/**
	 * Extract event type from various external service formats
	 */
	static extractEventType(data: any, fallback: string = 'unknown'): string {
		return this.extractString(data, ['event_type', 'type'], fallback);
	}

	/**
	 * Extract timestamp from various external service formats
	 */
	static extractTimestamp(data: any, fallback?: string): string {
		return this.extractString(data, ['timestamp', 'created_at'], fallback || new Date().toISOString());
	}

	/**
	 * Extract attributes from various external service formats
	 */
	static extractAttributes(data: any, fallback: Record<string, any> = {}): Record<string, any> {
		return this.extractObject(data, ['attributes'], fallback);
	}

	/**
	 * Extract subscriptions from various external service formats
	 */
	static extractSubscriptions(data: any, fallback: any[] = []): any[] {
		const value = this.extractValue(data, ['subscriptions', 'entitlements'], fallback);
		return Array.isArray(value) ? value : fallback;
	}
} 