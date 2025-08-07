import { Module } from '@nestjs/common';
import { ContractRegistrationService } from './contract-registration.service';
import { ContractFactoryService } from './contract-factory.service';

/**
 * Contracts Module
 * 
 * Provides base classes, utilities, and registration services for domain contracts,
 * context mappers, and anti-corruption layers across all domains.
 */
@Module({
	providers: [ContractRegistrationService, ContractFactoryService],
	exports: [ContractRegistrationService, ContractFactoryService],
})
export class ContractsModule {} 