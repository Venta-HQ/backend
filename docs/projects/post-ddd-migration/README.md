# Post-DDD Migration Project

This document outlines the plan for improving our codebase after the initial DDD migration. The focus is on leveraging our existing libraries, standardizing patterns, and improving maintainability.

## Project Goals

1. Reduce code duplication by using existing libraries
2. Improve security by using battle-tested implementations
3. Make the codebase more consistent and maintainable
4. Strengthen type safety and domain boundaries

## Implementation Plan

### Phase 1: Library Integration

#### 1. Replace Custom Webhook Handling

- Remove `WebhookSignatureACL`
- Update Clerk and RevenueCat controllers to use `@app/nest/webhooks`
- Use built-in webhook decorators, validation, and error handling
- Use built-in signature verification

#### 2. Replace Custom Event Handling

- Remove custom NATS code from all services
- Use `@app/nest/events` for all event handling
- Standardize event types and validation
- Use built-in event decorators and logging

#### 3. Standardize Error Handling

- Remove custom error handling from ACLs
- Use `@app/nest/errors` consistently
- Use standard error types and codes
- Use built-in error logging

#### 4. Standardize Validation

- Move common schemas to `@app/nest/validation`
- Use built-in validation decorators and pipes
- Share validation schemas across domains
- Remove duplicate validation logic

#### 5. Standardize Auth

- Use `@app/nest/auth` guards and decorators
- Remove custom auth logic
- Use built-in auth context
- Standardize role handling

#### 6. Standardize Logging

- Replace raw Logger usage with `@app/nest/logging`
- Add request correlation
- Add structured logging
- Add context metadata

### Phase 2: Domain Organization

#### 1. Move Misplaced Components

- Move app-level ACLs to contracts:
  - `AlgoliaACL` → `marketplace/contracts/anti-corruption-layers`
  - `NatsACL` → `marketplace/contracts/anti-corruption-layers`
  - `WebSocketACL` → `location-services/contracts/anti-corruption-layers`
- Move app-level context mappers to contracts:
  - `SearchToMarketplaceContextMapper` → `marketplace/contracts/context-mappers`
  - `RealtimeToMarketplaceContextMapper` → `location-services/contracts/context-mappers`

#### 2. Standardize Naming

- Rename ACLs consistently:
  - `ClerkAntiCorruptionLayer` → `ClerkACL`
  - `RevenueCatAntiCorruptionLayer` → `RevenueCatACL`
- Rename context mappers consistently
- Update all imports and usages

#### 3. Clean Up Unused Code

- Remove unused context mappers:
  - `MarketplaceToCommunicationContextMapper`
  - `MarketplaceToInfrastructureContextMapper`
- Remove unused ACLs
- Remove duplicate validation schemas

### Phase 3: Type Safety

#### 1. Audit Context Mapper Usage

- Ensure all cross-domain communication uses mappers
- Add missing mapper injections
- Fix type inconsistencies
- Add type predicates where needed

#### 2. Audit ACL Usage

- Ensure all external service interactions use ACLs
- Add missing ACL injections
- Fix validation inconsistencies
- Add proper error handling

#### 3. Standardize Domain Types

- Move all domain types to contracts
- Use consistent namespace structure
- Share common types through libs
- Add proper JSDoc documentation

## Implementation Order

### Priority 1: Library Integration

- Highest impact on code quality
- Reduces duplication significantly
- Improves security and maintainability
- Start with webhooks as they're most critical

### Priority 2: Domain Organization

- Makes codebase more navigable
- Improves maintainability
- Can be done gradually

### Priority 3: Type Safety

- Can be done in parallel with other work
- Improves reliability
- Catches issues early

## Example: Webhook Service Improvement

### Current Implementation

```typescript
@Post()
async handleClerkEvent(
  @Body() rawEvent: unknown,
  @Headers('svix-signature') signature?: string,
): Promise<{ message: string }> {
  if (!signature) {
    throw AppError.validation('COMMUNICATION_INVALID_WEBHOOK_SIGNATURE', 'Missing webhook signature');
  }

  const rawBody = JSON.stringify(rawEvent);
  const isValid = this.webhookACL.verifySignature(rawBody, signature, this.config);
  // ... more custom validation and handling
}
```

### Using Our Library

```typescript
@Post()
@WebhookHandler({
  provider: 'clerk',
  secret: process.env.CLERK_WEBHOOK_SECRET,
})
async handleClerkEvent(
  @WebhookBody() event: ClerkWebhookEvent,
  @WebhookMetadata() metadata: WebhookMetadata,
): Promise<void> {
  // Event is already validated and typed
  // Signature is already verified
  // Error handling is built-in
  await this.handleClerkWebhook(event, metadata);
}
```

## Benefits

1. **Reduced Code Duplication**: Using our libraries eliminates the need to rewrite common functionality
2. **Improved Security**: Battle-tested implementations for critical features like webhook signature verification
3. **Better Maintainability**: Standardized patterns and centralized logic make the code easier to maintain
4. **Type Safety**: Stronger type checking and better domain boundaries
5. **Consistency**: Standard approaches to common problems across the codebase
