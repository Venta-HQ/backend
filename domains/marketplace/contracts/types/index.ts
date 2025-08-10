/**
 * Marketplace Domain Types
 *
 * Organized by purpose and communication boundaries:
 *
 * 1. **gRPC**: Import directly from @venta/proto/* (wire format)
 * 2. **Domain**: Types that map to/from gRPC (inter-domain communication)
 * 3. **Internal**: Business logic types that don't cross boundaries
 *
 * Data Flow:
 * ```
 * gRPC Types (@venta/proto) → [ACL Pipes] → Domain Types → [Business Logic] → Internal Types
 * ```
 *
 * Usage Examples:
 * ```typescript
 * // gRPC input/output - import directly from proto
 * import type { VendorCreateData } from '@venta/proto/marketplace/vendor-management';
 *
 * // Domain representation (what gRPC maps to)
 * import type { VendorCreate } from '@venta/domains/marketplace/contracts/types/domain';
 *
 * // Internal business logic
 * import type { VendorProfile, UserSubscription } from '@venta/domains/marketplace/contracts/types/internal';
 * ```
 */

// ============================================================================
// Export by Category
// ============================================================================

export * as Domain from './domain';
export * as Internal from './internal';

// ============================================================================
// Convenience Re-exports for Common Types
// ============================================================================

// Most frequently used domain types
export type { UserIdentity, VendorCreate, VendorUpdate, VendorEntity, Coordinates } from './domain';

// Most frequently used internal types
export type { UserProfile, UserSubscription, VendorProfile, ClerkUser, RevenueCatSubscription } from './internal';

// Legacy exports for gradual migration
export { Marketplace } from './context-mapping.types';
