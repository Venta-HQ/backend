import { z } from 'zod';

// Valid domains - duplicated for type-only usage
export const VALID_DOMAINS = [
	'marketplace', // Business marketplace operations
	'location', // Location and geospatial services
] as const;

// Domain-subdomain mapping - duplicated for type-only usage
export const DOMAIN_SUBDOMAINS: Record<ValidDomain, readonly string[]> = {
	marketplace: ['user', 'vendor', 'search', 'reviews', 'favorites'],
	location: ['geolocation', 'proximity', 'real_time', 'geofencing', 'vendor', 'user'],
} as const;

// Type definitions
export type ValidDomain = (typeof VALID_DOMAINS)[number];
export type ValidSubdomain<TDomain extends ValidDomain> = (typeof DOMAIN_SUBDOMAINS)[TDomain][number];

/**
 * Type that generates all valid event name patterns for a domain
 * Enforces domain and subdomain boundaries, but allows any action
 * Pattern: domain.subdomain.action (e.g., marketplace.vendor.onboarded)
 */
export type ValidEventNamePattern<TDomain extends ValidDomain> = `${TDomain}.${ValidSubdomain<TDomain>}.${string}`;

/**
 * Union of all valid event names across all domains
 */
export type ValidEventName = ValidEventNamePattern<ValidDomain>;

/**
 * Type for a Zod schema object that only contains valid event names for a domain
 */
export type DomainEventSchema<TDomain extends ValidDomain> = Record<ValidEventNamePattern<TDomain>, z.ZodSchema>;

/**
 * Helper type to enforce that an object only contains valid event names for a domain
 * Now simplified - no need for the redundant second parameter!
 */
export type EnforceValidDomainEvents<TDomain extends ValidDomain> = DomainEventSchema<TDomain>;
