/**
 * Internal User Types
 *
 * Types used for internal business logic that are NOT communicated via gRPC.
 * These are domain-specific concepts that don't cross boundaries.
 */

// ============================================================================
// User Business Logic Types
// ============================================================================

export interface UserSubscription {
	id: string;
	userId: string;
	status: 'active' | 'cancelled' | 'expired' | 'trial';
	provider: 'revenuecat' | 'stripe';
	externalId: string;
	productId: string;
	planType: 'basic' | 'premium' | 'enterprise';
	startDate: string;
	endDate?: string;
	trialEndsAt?: string;
	renewsAt?: string;
}

export interface UserProfile {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	imageUrl?: string;
	preferences: UserPreferences;
	subscription?: UserSubscription;
	createdAt: string;
	updatedAt: string;
}

export interface UserPreferences {
	language: 'en' | 'es' | 'fr';
	timezone: string;
	notifications: {
		email: boolean;
		push: boolean;
		sms: boolean;
	};
	privacy: {
		profileVisibility: 'public' | 'private';
		locationSharing: boolean;
	};
}

// ============================================================================
// User Activity & Analytics
// ============================================================================

export interface UserActivity {
	userId: string;
	action: string;
	resource: string;
	metadata?: Record<string, unknown>;
	timestamp: string;
	ipAddress?: string;
	userAgent?: string;
}

export interface UserSession {
	id: string;
	userId: string;
	deviceInfo: {
		platform: 'web' | 'ios' | 'android';
		browser?: string;
		version?: string;
	};
	location?: {
		country: string;
		region: string;
		city: string;
	};
	startedAt: string;
	lastActiveAt: string;
	expiresAt: string;
}
