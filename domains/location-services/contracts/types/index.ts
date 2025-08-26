/**
 * Location Services Domain Types
 *
 * Organized by purpose and communication boundaries:
 *
 * 1. **gRPC**: Import directly from @venta/proto/* (wire format) - when available
 * 2. **Domain**: Types that map to/from gRPC (inter-domain communication)
 *
 * Data Flow:
 * ```
 * gRPC Types (@venta/proto) → [ACL Pipes] → Domain Types → [Business Logic]
 * ```
 */

// ============================================================================
// Export by Category
// ============================================================================

export * as Domain from './domain';

// ============================================================================
// Convenience Re-exports for Common Types
// ============================================================================

// Most frequently used domain types
export type { LocationUpdate, GeospatialQuery, LocationResult } from './domain';
