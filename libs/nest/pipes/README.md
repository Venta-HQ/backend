# Pipes

This directory contains NestJS pipes for request validation and transformation.

## Available Pipes

- **[SchemaValidatorPipe](./schema-validator/README.md)** - Universal schema-based validation using Zod

## Usage

```typescript
import { SchemaValidatorPipe } from '@app/nest/pipes';

// Use with Zod schemas for validation
@UsePipes(new SchemaValidatorPipe(MySchema))
```
