/**
 * Location Services Contracts Index
 *
 * Main export point for location services domain contracts including:
 * - ACL classes for gRPC ↔ Domain transformations
 * - WebSocket message schemas for validation
 * - Type definitions organized by purpose
 */

// ============================================================================
// ACL CLASSES - Multi-protocol validation and transformation
// ============================================================================

// Location-related ACL classes (gRPC ↔ Domain, WebSocket ↔ Domain)
export {
	LocationUpdateACL,
	GeospatialQueryACL,
	UserLocationUpdateACL,
	VendorLocationUpdateACL,
} from './acl/location.acl';

// (Removed) Realtime-related ACL classes - no current usage

// ============================================================================
// WebSocket Schemas
// ============================================================================

// WebSocket message validation schemas
export {
	userLocationUpdateSchema,
	vendorLocationUpdateSchema,
	type UserLocationUpdateRequest,
	type VendorLocationUpdateRequest,
} from './schemas/websocket.schemas';

// ============================================================================
// Type Re-exports
// ============================================================================

// Type categories (accessible via contracts.Types.domain.*)
export * as Types from './types';
