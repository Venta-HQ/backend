# Configuration Module

## Purpose

The Configuration module provides centralized configuration management for the Venta backend system. It handles environment variable loading, validation, and provides type-safe configuration access across all microservices.

## What It Contains

- **Config Service**: Main configuration service with environment variable access
- **Config Schema**: Environment variable validation and type definitions
- **Config Module**: NestJS module for configuration injection
- **Environment Validation**: Runtime validation of required configuration

## Usage

This module is imported by all microservices and the gateway to provide consistent configuration management.

### For Services
- Import config service for environment variable access
- Use config schema for validation
- Apply configuration for service-specific settings
- Configure environment-specific behavior

### For Gateway
- Import config for API configuration
- Use config service for external service settings
- Apply configuration for different environments
- Configure security and performance settings

## Key Benefits

- **Type Safety**: Type-safe configuration access
- **Validation**: Runtime validation of configuration values
- **Consistency**: Uniform configuration across all services
- **Maintainability**: Centralized configuration management

## Dependencies

- NestJS framework
- Joi for configuration validation
- TypeScript for type definitions 