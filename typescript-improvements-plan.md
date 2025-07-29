# TypeScript Improvements Plan

## Overview

After updating the Nx configuration to follow modern best practices, we've identified several TypeScript errors that need to be fixed. These errors are now visible because we enabled stricter TypeScript settings.

## TypeScript Errors to Fix

### 1. Unused Variables (TS6133)

- `libs/nest/filters/exception.filter.ts:89` - `_grpcError` is declared but never used
- `libs/nest/modules/clerk/clerk.service.ts:6` - `logger` is declared but never used
- `libs/nest/modules/events/nats-events.service.ts:12` - `failedEventsKey` is declared but never used
- `libs/nest/modules/events/nats-events.service.ts:13` - `maxRetries` is declared but never used
- `libs/nest/modules/events/nats-events.service.ts:106` - `_failedEvent` is declared but never used
- `libs/nest/modules/grpc-instance/grpc-instance.service.ts:7` - `logger` is declared but never used
- `libs/nest/modules/upload/upload.service.ts:8` - `logger` is declared but never used

### 2. Type Safety Issues

- `libs/nest/modules/algolia/algolia.service.ts:40` - Return type mismatch
- `libs/nest/modules/events/nats-events.service.ts:10` - Property not definitely assigned
- `libs/nest/modules/events/nats-events.service.ts:141` - Promise condition always true
- `libs/nest/modules/grpc-instance/grpc-instance.module.ts:51` - Type constraint issue
- `libs/nest/modules/grpc-instance/grpc-instance.service.ts:16` - Missing return statement
- `libs/nest/modules/logger/logger.module.ts:58-62` - String | undefined type issues
- `libs/nest/modules/prisma/prisma.service.ts:10` - Implicit any type
- `libs/nest/modules/upload/upload.service.ts:4` - Missing type declarations
- `libs/nest/modules/upload/upload.service.ts:21` - Undefined type issue

## Fix Strategy

### Phase 1: Remove Unused Variables

- Remove or prefix unused variables with underscore
- Remove unused logger instances if not needed

### Phase 2: Fix Type Safety Issues

- Add proper type annotations
- Handle undefined cases properly
- Add missing return statements
- Fix Promise handling

### Phase 3: Add Missing Type Declarations

- Install missing @types packages
- Add custom type declarations where needed

## Benefits of These Changes

1. **Better Code Quality**: Stricter type checking catches potential bugs
2. **Improved Maintainability**: Clear type definitions make code easier to understand
3. **Better IDE Support**: Enhanced autocomplete and error detection
4. **Modern Standards**: Aligns with current TypeScript best practices

## Next Steps

1. Fix unused variables first (quick wins)
2. Address type safety issues systematically
3. Add missing type declarations
4. Test all builds to ensure everything works
