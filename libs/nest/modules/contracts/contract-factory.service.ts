import { Injectable, Logger } from '@nestjs/common';
import { ContractRegistrationService } from './contract-registration.service';
import { BaseContextMapper } from './base/base-context-mapper';
import { BaseAntiCorruptionLayer } from './base/base-anti-corruption-layer';

/**
 * Contract Factory Service
 * 
 * Provides utilities for creating and configuring contracts, context mappers,
 * and anti-corruption layers with consistent patterns and validation.
 */
@Injectable()
export class ContractFactoryService {
	private readonly logger = new Logger(ContractFactoryService.name);

	constructor(private readonly registrationService: ContractRegistrationService) {}

	// ============================================================================
	// Context Mapper Factory Methods
	// ============================================================================

	/**
	 * Create and register a context mapper
	 */
	createContextMapper<T extends BaseContextMapper>(
		mapperClass: new (...args: any[]) => T,
		...args: any[]
	): T {
		try {
			const mapper = new mapperClass(...args);
			
			// Validate the mapper
			if (!mapper.getDomain() || !mapper.getTargetDomain()) {
				throw new Error('Invalid context mapper: missing domain information');
			}

			// Register the mapper
			this.registrationService.registerContextMapper(mapper);

			this.logger.log(`Created and registered context mapper: ${mapper.getDomain()} -> ${mapper.getTargetDomain()}`);

			return mapper;
		} catch (error) {
			this.logger.error('Failed to create context mapper', error.stack, { mapperClass: mapperClass.name, args });
			throw error;
		}
	}

	/**
	 * Create multiple context mappers for a domain
	 */
	createContextMappersForDomain(
		mappers: Array<{ class: new (...args: any[]) => BaseContextMapper; args?: any[] }>
	): BaseContextMapper[] {
		const createdMappers: BaseContextMapper[] = [];

		for (const mapperConfig of mappers) {
			try {
				const mapper = this.createContextMapper(
					mapperConfig.class,
					...(mapperConfig.args || [])
				);
				createdMappers.push(mapper);
			} catch (error) {
				this.logger.error('Failed to create context mapper for domain', error.stack, { mapperConfig });
				throw error;
			}
		}

		return createdMappers;
	}

	// ============================================================================
	// Anti-Corruption Layer Factory Methods
	// ============================================================================

	/**
	 * Create and register an anti-corruption layer
	 */
	createAntiCorruptionLayer<T extends BaseAntiCorruptionLayer>(
		layerClass: new (...args: any[]) => T,
		...args: any[]
	): T {
		try {
			const layer = new layerClass(...args);
			
			// Validate the layer
			if (!layer.getDomain() || !layer.getExternalService()) {
				throw new Error('Invalid anti-corruption layer: missing domain or service information');
			}

			// Register the layer
			this.registrationService.registerAntiCorruptionLayer(layer);

			this.logger.log(`Created and registered anti-corruption layer: ${layer.getDomain()} -> ${layer.getExternalService()}`);

			return layer;
		} catch (error) {
			this.logger.error('Failed to create anti-corruption layer', error.stack, { layerClass: layerClass.name, args });
			throw error;
		}
	}

	/**
	 * Create multiple anti-corruption layers for a domain
	 */
	createAntiCorruptionLayersForDomain(
		layers: Array<{ class: new (...args: any[]) => BaseAntiCorruptionLayer; args?: any[] }>
	): BaseAntiCorruptionLayer[] {
		const createdLayers: BaseAntiCorruptionLayer[] = [];

		for (const layerConfig of layers) {
			try {
				const layer = this.createAntiCorruptionLayer(
					layerConfig.class,
					...(layerConfig.args || [])
				);
				createdLayers.push(layer);
			} catch (error) {
				this.logger.error('Failed to create anti-corruption layer for domain', error.stack, { layerConfig });
				throw error;
			}
		}

		return createdLayers;
	}

	// ============================================================================
	// Contract Factory Methods
	// ============================================================================

	/**
	 * Create and register a contract implementation
	 */
	createContract<T>(
		contractName: string,
		contractClass: new (...args: any[]) => T,
		...args: any[]
	): T {
		try {
			const contract = new contractClass(...args);
			
			// Register the contract
			this.registrationService.registerContract(contractName, contract);

			this.logger.log(`Created and registered contract: ${contractName}`);

			return contract;
		} catch (error) {
			this.logger.error('Failed to create contract', error.stack, { contractName, contractClass: contractClass.name, args });
			throw error;
		}
	}

	/**
	 * Create multiple contracts for a domain
	 */
	createContractsForDomain(
		contracts: Array<{ name: string; class: new (...args: any[]) => any; args?: any[] }>
	): Map<string, any> {
		const createdContracts = new Map<string, any>();

		for (const contractConfig of contracts) {
			try {
				const contract = this.createContract(
					contractConfig.name,
					contractConfig.class,
					...(contractConfig.args || [])
				);
				createdContracts.set(contractConfig.name, contract);
			} catch (error) {
				this.logger.error('Failed to create contract for domain', error.stack, { contractConfig });
				throw error;
			}
		}

		return createdContracts;
	}

	// ============================================================================
	// Domain Setup Methods
	// ============================================================================

	/**
	 * Setup complete contract infrastructure for a domain
	 */
	setupDomainContracts(config: {
		domain: string;
		contextMappers?: Array<{ class: new (...args: any[]) => BaseContextMapper; args?: any[] }>;
		antiCorruptionLayers?: Array<{ class: new (...args: any[]) => BaseAntiCorruptionLayer; args?: any[] }>;
		contracts?: Array<{ name: string; class: new (...args: any[]) => any; args?: any[] }>;
	}): {
		contextMappers: BaseContextMapper[];
		antiCorruptionLayers: BaseAntiCorruptionLayer[];
		contracts: Map<string, any>;
	} {
		this.logger.log(`Setting up contract infrastructure for domain: ${config.domain}`);

		const contextMappers = config.contextMappers 
			? this.createContextMappersForDomain(config.contextMappers)
			: [];

		const antiCorruptionLayers = config.antiCorruptionLayers
			? this.createAntiCorruptionLayersForDomain(config.antiCorruptionLayers)
			: [];

		const contracts = config.contracts
			? this.createContractsForDomain(config.contracts)
			: new Map();

		this.logger.log(`Successfully setup contract infrastructure for domain: ${config.domain}`, {
			contextMappersCount: contextMappers.length,
			antiCorruptionLayersCount: antiCorruptionLayers.length,
			contractsCount: contracts.size,
		});

		return {
			contextMappers,
			antiCorruptionLayers,
			contracts,
		};
	}

	// ============================================================================
	// Validation and Health Check Methods
	// ============================================================================

	/**
	 * Validate all created components
	 */
	validateSetup(): { valid: boolean; errors: string[] } {
		return this.registrationService.validateRegistrations();
	}

	/**
	 * Get setup statistics
	 */
	getSetupStats() {
		return this.registrationService.getRegistrationStats();
	}

	/**
	 * Clear all created components (useful for testing)
	 */
	clearSetup(): void {
		this.registrationService.clearRegistrations();
		this.logger.log('Cleared all contract setup');
	}
} 