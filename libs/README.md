# Shared Libraries

This directory contains shared libraries used across the Venta backend services. These libraries provide common functionality, types, and utilities that can be imported and used by any service in the monorepo.

## Library Structure

### `@libs/nest` - NestJS Framework Libraries

Reusable NestJS modules, guards, filters, pipes, and error handling utilities.

### `@libs/apitypes` - API Type Definitions

Shared TypeScript types, interfaces, and validation schemas for API contracts.

### `@libs/proto` - Protocol Buffer Definitions

Generated TypeScript code from Protocol Buffer definitions for gRPC services.

## Usage

Each library can be imported into your service modules as needed. The libraries are designed to be modular, so you only need to import the specific functionality you require.

## Development

When adding new functionality to these libraries:

1. Ensure it's truly shared across multiple services
2. Follow the existing patterns and structure
3. Include proper TypeScript types and documentation
4. Add appropriate tests for new functionality
