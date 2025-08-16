/**
 * Vendor Domain Types
 *
 * Internal domain representations that map to/from gRPC types.
 * These are the "clean" types that represent our domain concepts.
 *
 * Mapping:
 * - VendorCreateData (gRPC) -> VendorCreate (Domain)
 * - VendorUpdateData (gRPC) -> VendorUpdate (Domain)
 * - Vendor (gRPC) -> VendorEntity (Domain)
 */

// ============================================================================
// Vendor CRUD Operations (from gRPC types)
// ============================================================================

export interface VendorCreate {
	name: string;
	description: string;
	email: string;
	phone: string;
	website: string;
	profileImage: string;
}

export interface VendorUpdate {
	id: string;
	name: string;
	description: string;
	email: string;
	website: string;
	phone: string;
	profileImage: string;
}

export interface VendorLookup {
	vendorId: string;
}

// ============================================================================
// Vendor Entity (from gRPC Vendor)
// ============================================================================

export interface VendorEntity {
	id: string;
	coordinates: Coordinates;
	name: string;
	description: string;
	phone: string;
	email: string;
	website: string;
	isOpen: boolean;
	primaryImage: string;
	createdAt: string;
	updatedAt: string;
}

// ============================================================================
// Shared Types
// ============================================================================

export interface Coordinates {
	lat: number;
	lng: number; // Note: gRPC uses 'long', domain uses 'lng' for clarity
}
