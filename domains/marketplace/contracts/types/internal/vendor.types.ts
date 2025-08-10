/**
 * Internal Vendor Types
 *
 * Types used for internal business logic that are NOT communicated via gRPC.
 * These are domain-specific concepts that don't cross boundaries.
 */

// ============================================================================
// Vendor Business Logic Types
// ============================================================================

export interface VendorProfile {
	id: string;
	ownerId: string;
	name: string;
	description: string;
	email: string;
	phone: string;
	website: string;

	// Business details
	businessType: 'restaurant' | 'retail' | 'service' | 'entertainment' | 'other';
	categories: string[];
	tags: string[];

	// Media
	primaryImage: string;
	gallery: VendorImage[];

	// Location & hours
	location: VendorLocation;
	businessHours: VendorBusinessHours;

	// Status & metadata
	isActive: boolean;
	isVerified: boolean;
	verificationLevel: 'none' | 'basic' | 'premium';

	// Analytics
	metrics: VendorMetrics;

	createdAt: string;
	updatedAt: string;
}

export interface VendorLocation {
	vendorId: string;
	coordinates: {
		lat: number;
		lng: number;
	};
	address: {
		street: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
	};
	isCurrentLocation: boolean;
	updatedAt: string;
}

export interface VendorImage {
	id: string;
	url: string;
	type: 'logo' | 'banner' | 'gallery' | 'menu' | 'other';
	caption?: string;
	order: number;
	uploadedAt: string;
}

export interface VendorBusinessHours {
	vendorId: string;
	schedule: {
		monday: DaySchedule;
		tuesday: DaySchedule;
		wednesday: DaySchedule;
		thursday: DaySchedule;
		friday: DaySchedule;
		saturday: DaySchedule;
		sunday: DaySchedule;
	};
	timezone: string;
	specialHours: SpecialHours[];
}

export interface DaySchedule {
	isOpen: boolean;
	openTime?: string; // HH:MM format
	closeTime?: string; // HH:MM format
	breaks?: Array<{
		startTime: string;
		endTime: string;
		reason?: string;
	}>;
}

export interface SpecialHours {
	date: string; // YYYY-MM-DD
	isOpen: boolean;
	openTime?: string;
	closeTime?: string;
	reason?: string; // 'holiday', 'maintenance', 'event', etc.
}

// ============================================================================
// Vendor Analytics & Performance
// ============================================================================

export interface VendorMetrics {
	vendorId: string;
	views: {
		total: number;
		thisMonth: number;
		thisWeek: number;
	};
	interactions: {
		clicks: number;
		calls: number;
		directions: number;
		websiteVisits: number;
	};
	ratings: {
		average: number;
		count: number;
		distribution: {
			1: number;
			2: number;
			3: number;
			4: number;
			5: number;
		};
	};
	lastUpdated: string;
}

// ============================================================================
// Vendor Search & Discovery
// ============================================================================

export interface VendorSearchFilter {
	query?: string;
	categories?: string[];
	tags?: string[];
	businessType?: string;
	location?: {
		center: { lat: number; lng: number };
		radiusKm: number;
	};
	bounds?: {
		ne: { lat: number; lng: number };
		sw: { lat: number; lng: number };
	};
	isOpen?: boolean;
	isVerified?: boolean;
	rating?: {
		min: number;
		max?: number;
	};
}

export interface VendorSearchResult {
	vendor: VendorProfile;
	distance?: number; // in kilometers
	relevanceScore: number;
	matchedCategories: string[];
	matchedTags: string[];
}
