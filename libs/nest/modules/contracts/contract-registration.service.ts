import { Injectable, Logger } from '@nestjs/common';
import { BaseContextMapper } from './base/base-context-mapper';
import { BaseAntiCorruptionLayer } from './base/base-anti-corruption-layer';

/**
 * Contract Registration Service
 * 
 * Provides utilities for registering contracts, context mappers, and anti-corruption layers
 * across domains with consistent patterns and validation.
 */
@Injectable()
export class ContractRegistrationService {
	private readonly logger = new Logger(ContractRegistrationService.name);

	// ============================================================================
	// Registration Tracking
	// ============================================================================

	private readonly registeredContextMappers = new Map<string, BaseContextMapper>();
	private readonly registeredAntiCorruptionLayers = new Map<string, BaseAntiCorruptionLayer>();
	private readonly registeredContracts = new Map<string, any>();

	// ============================================================================
	// Context Mapper Registration
	// ============================================================================

	/**
	 * Register a context mapper
	 */
	registerContextMapper(mapper: BaseContextMapper): void {
		const key = this.createContextMapperKey(mapper.getDomain(), mapper.getTargetDomain());
		
		if (this.registeredContextMappers.has(key)) {
			this.logger.warn(`Context mapper already registered for ${key}`, {
				domain: mapper.getDomain(),
				targetDomain: mapper.getTargetDomain(),
			});
			return;
		}

		this.registeredContextMappers.set(key, mapper);
		this.logger.log(`Registered context mapper: ${key}`, {
			domain: mapper.getDomain(),
			targetDomain: mapper.getTargetDomain(),
		});
	}

	/**
	 * Get a registered context mapper
	 */
	getContextMapper(sourceDomain: string, targetDomain: string): BaseContextMapper | undefined {
		const key = this.createContextMapperKey(sourceDomain, targetDomain);
		return this.registeredContextMappers.get(key);
	}

	/**
	 * Get all context mappers for a domain
	 */
	getContextMappersForDomain(domain: string): BaseContextMapper[] {
		return Array.from(this.registeredContextMappers.values()).filter(
			mapper => mapper.getDomain() === domain
		);
	}

	/**
	 * Get all context mappers targeting a domain
	 */
	getContextMappersTargetingDomain(targetDomain: string): BaseContextMapper[] {
		return Array.from(this.registeredContextMappers.values()).filter(
			mapper => mapper.getTargetDomain() === targetDomain
		);
	}

	// ============================================================================
	// Anti-Corruption Layer Registration
	// ============================================================================

	/**
	 * Register an anti-corruption layer
	 */
	registerAntiCorruptionLayer(layer: BaseAntiCorruptionLayer): void {
		const key = this.createAntiCorruptionLayerKey(layer.getDomain(), layer.getExternalService());
		
		if (this.registeredAntiCorruptionLayers.has(key)) {
			this.logger.warn(`Anti-corruption layer already registered for ${key}`, {
				domain: layer.getDomain(),
				externalService: layer.getExternalService(),
			});
			return;
		}

		this.registeredAntiCorruptionLayers.set(key, layer);
		this.logger.log(`Registered anti-corruption layer: ${key}`, {
			domain: layer.getDomain(),
			externalService: layer.getExternalService(),
		});
	}

	/**
	 * Get a registered anti-corruption layer
	 */
	getAntiCorruptionLayer(domain: string, externalService: string): BaseAntiCorruptionLayer | undefined {
		const key = this.createAntiCorruptionLayerKey(domain, externalService);
		return this.registeredAntiCorruptionLayers.get(key);
	}

	/**
	 * Get all anti-corruption layers for a domain
	 */
	getAntiCorruptionLayersForDomain(domain: string): BaseAntiCorruptionLayer[] {
		return Array.from(this.registeredAntiCorruptionLayers.values()).filter(
			layer => layer.getDomain() === domain
		);
	}

	/**
	 * Get all anti-corruption layers for an external service
	 */
	getAntiCorruptionLayersForExternalService(externalService: string): BaseAntiCorruptionLayer[] {
		return Array.from(this.registeredAntiCorruptionLayers.values()).filter(
			layer => layer.getExternalService() === externalService
		);
	}

	// ============================================================================
	// Contract Registration
	// ============================================================================

	/**
	 * Register a contract implementation
	 */
	registerContract(contractName: string, contractImpl: any): void {
		if (this.registeredContracts.has(contractName)) {
			this.logger.warn(`Contract already registered: ${contractName}`);
			return;
		}

		this.registeredContracts.set(contractName, contractImpl);
		this.logger.log(`Registered contract: ${contractName}`);
	}

	/**
	 * Get a registered contract
	 */
	getContract(contractName: string): any | undefined {
		return this.registeredContracts.get(contractName);
	}

	/**
	 * Get all registered contracts
	 */
	getAllContracts(): Map<string, any> {
		return new Map(this.registeredContracts);
	}

	// ============================================================================
	// Validation and Health Checks
	// ============================================================================

	/**
	 * Validate all registered components
	 */
	validateRegistrations(): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Validate context mappers
		for (const [key, mapper] of this.registeredContextMappers.entries()) {
			try {
				if (!mapper.getDomain() || !mapper.getTargetDomain()) {
					errors.push(`Invalid context mapper ${key}: missing domain information`);
				}
			} catch (error) {
				errors.push(`Error validating context mapper ${key}: ${error.message}`);
			}
		}

		// Validate anti-corruption layers
		for (const [key, layer] of this.registeredAntiCorruptionLayers.entries()) {
			try {
				if (!layer.getDomain() || !layer.getExternalService()) {
					errors.push(`Invalid anti-corruption layer ${key}: missing domain or service information`);
				}
			} catch (error) {
				errors.push(`Error validating anti-corruption layer ${key}: ${error.message}`);
			}
		}

		// Validate contracts
		for (const [name, contract] of this.registeredContracts.entries()) {
			try {
				if (!contract || typeof contract !== 'object') {
					errors.push(`Invalid contract ${name}: not an object`);
				}
			} catch (error) {
				errors.push(`Error validating contract ${name}: ${error.message}`);
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Get registration statistics
	 */
	getRegistrationStats(): {
		contextMappers: number;
		antiCorruptionLayers: number;
		contracts: number;
		domains: string[];
		externalServices: string[];
	} {
		const domains = new Set<string>();
		const externalServices = new Set<string>();

		// Collect domains from context mappers
		for (const mapper of this.registeredContextMappers.values()) {
			domains.add(mapper.getDomain());
			domains.add(mapper.getTargetDomain());
		}

		// Collect domains and external services from anti-corruption layers
		for (const layer of this.registeredAntiCorruptionLayers.values()) {
			domains.add(layer.getDomain());
			externalServices.add(layer.getExternalService());
		}

		return {
			contextMappers: this.registeredContextMappers.size,
			antiCorruptionLayers: this.registeredAntiCorruptionLayers.size,
			contracts: this.registeredContracts.size,
			domains: Array.from(domains),
			externalServices: Array.from(externalServices),
		};
	}

	// ============================================================================
	// Utility Methods
	// ============================================================================

	/**
	 * Create context mapper key
	 */
	private createContextMapperKey(sourceDomain: string, targetDomain: string): string {
		return `${sourceDomain}->${targetDomain}`;
	}

	/**
	 * Create anti-corruption layer key
	 */
	private createAntiCorruptionLayerKey(domain: string, externalService: string): string {
		return `${domain}->${externalService}`;
	}

	/**
	 * Clear all registrations (useful for testing)
	 */
	clearRegistrations(): void {
		this.registeredContextMappers.clear();
		this.registeredAntiCorruptionLayers.clear();
		this.registeredContracts.clear();
		this.logger.log('Cleared all contract registrations');
	}
} 