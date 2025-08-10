# Enhanced Error Handling Migration Guide

## Overview

This guide demonstrates how to migrate from the current error handling system to the enhanced version that provides better intellisense, type safety, and developer experience.

## Problems with Current System

1. **No intellisense for error messages** - When you see `ErrorCodes.ERR_USER_NOT_FOUND`, you have no idea what the resulting message will be
2. **No intellisense for required context** - You don't know what variables the error message expects
3. **Runtime errors from typos** - Misspelled context variables fail silently
4. **No validation** - Context can have wrong types or missing required fields
5. **Poor debugging experience** - Hard to preview what error messages will look like

## Benefits of Enhanced System

1. **✅ Full intellisense** - See error message templates and required context
2. **✅ Type safety** - Context is validated at compile time and runtime
3. **✅ Message preview** - Know exactly what the error will say
4. **✅ Domain-specific helpers** - Convenient error creators for each domain
5. **✅ Better testing** - Type-safe error assertions
6. **✅ Development tools** - Preview and inspect errors without throwing

## Migration Strategy

### Phase 1: Add Enhanced System (Non-Breaking)

The enhanced system can coexist with the current system. Start using it in new code:

```typescript
// ✅ Start using enhanced errors in new code
import { EnhancedAppError, ErrorCodes } from '@venta/nest/errors/enhanced';

// Instead of:
// throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.ERR_USER_NOT_FOUND, { userId });

// Use static methods with auto-generated enum (recommended pattern):
throw EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId });
throw EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, { fields: ['name'] });
throw EnhancedAppError.forbidden(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, { userId, vendorId });
```

### Phase 2: Gradual Migration

Migrate existing error usage one domain at a time:

```typescript
// BEFORE: Generic error creation
throw new AppError(ErrorType.VALIDATION, ErrorCodes.ERR_VENDOR_INCOMPLETE, {
	fields: ['name', 'email'], // No intellisense, could have typos
});

// AFTER: Enhanced error creation with static methods and enum (recommended)
throw EnhancedAppError.validation(ErrorCodes.ERR_VENDOR_INCOMPLETE, {
	fields: ['name', 'email'], // ✅ Full intellisense and type safety
});
```

### Phase 3: Update Exception Filters (Optional)

Update exception filters to handle both error types:

```typescript
import { EnhancedAppError } from '@venta/nest/errors/enhanced';

if (exception instanceof EnhancedAppError) {
	// Handle enhanced errors - more detailed information available
	const details = exception.getErrorDetails();
	// ... enhanced error handling
} else if (exception instanceof AppError) {
	// Handle legacy errors
	// ... existing error handling
}
```

## Code Examples

### User Domain Errors

```typescript
// BEFORE
throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.ERR_USER_NOT_FOUND, { userId: '123' });
throw new AppError(ErrorType.VALIDATION, ErrorCodes.ERR_USER_EXISTS, { email: 'test@example.com' });

// AFTER - Use static methods with auto-generated enum (recommended pattern)
throw EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId: '123' });
throw EnhancedAppError.validation(ErrorCodes.ERR_USER_EXISTS, { email: 'test@example.com' });
```

### Vendor Domain Errors

```typescript
// BEFORE
throw new AppError(ErrorType.VALIDATION, ErrorCodes.ERR_VENDOR_INCOMPLETE, {
	fields: ['name', 'email'],
});
throw new AppError(ErrorType.UNAUTHORIZED, ErrorCodes.ERR_VENDOR_UNAUTHORIZED, {
	userId: 'user-123',
	vendorId: 'vendor-456',
});

// AFTER - Static methods with auto-generated enum (recommended)
throw EnhancedAppError.validation(ErrorCodes.ERR_VENDOR_INCOMPLETE, { fields: ['name', 'email'] });
throw EnhancedAppError.forbidden(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, { userId: 'user-123', vendorId: 'vendor-456' });
```

### Location Domain Errors

```typescript
// BEFORE
throw new AppError(ErrorType.VALIDATION, ErrorCodes.ERR_LOC_INVALID_COORDS, {
	lat: 91.5,
	long: -200.3,
});

// AFTER - Static method with auto-generated enum (recommended)
throw EnhancedAppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, { lat: 91.5, long: -200.3 });
```

### Complex Error Context

```typescript
// BEFORE - Easy to make mistakes
throw new AppError(ErrorType.EXTERNAL_SERVICE, ErrorCodes.ERR_INFRA_UPLOAD_FAILED, {
	filename: 'document.pdf',
	message: 'Network timeout', // Could be typo: 'mesage'
});

// AFTER - Static method with auto-generated enum (recommended)
throw EnhancedAppError.externalService(ErrorCodes.ERR_INFRA_UPLOAD_FAILED, {
	filename: 'document.pdf',
	message: 'Network timeout', // ✅ TypeScript validates context structure
});
```

## Development Experience Improvements

### Error Message Preview

```typescript
import { ErrorCodes, getErrorInfo, previewError } from '@venta/nest/errors/enhanced';

// Preview what an error message will look like
const preview = previewError(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, {
	userId: 'user-123',
	vendorId: 'vendor-456',
});
console.log(preview); // "User "user-123" is not authorized to manage vendor "vendor-456""

// Get error schema information
const info = getErrorInfo(ErrorCodes.ERR_USER_INCOMPLETE);
console.log(info.template); // "User profile is incomplete. Missing: {fields}"
console.log(info.requiredFields); // ['fields']
```

### Rich Hover Information

The enhanced error system provides rich hover tooltips that show both the message template and required context:

```typescript
// When you hover over any ErrorCodes value, you see:
throw EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId });
//                               ↑ Hover shows: "User with ID "{userId}" not found" - Required: { userId: string }

throw EnhancedAppError.validation(ErrorCodes.ERR_VENDOR_INCOMPLETE, { fields });
//                                 ↑ Hover shows: "Vendor profile is incomplete. Missing: {fields}" - Required: { fields: string[] }

throw EnhancedAppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, { lat, long });
//                                 ↑ Hover shows: "Invalid coordinates: lat={lat}, long={long}" - Required: { lat: number, long: number }
```

This eliminates the guesswork - you instantly know:

- **Exact message template** with placeholder variables
- **Required context structure** with TypeScript types
- **No need to look up documentation** or search through schema files

### Better Testing

```typescript
// BEFORE - No type safety in tests
try {
	service.getUser('invalid-id');
} catch (error) {
	expect(error.code).toBe('ERR_USER_NOT_FOUND'); // Could be typo
	expect(error.context.userId).toBe('invalid-id'); // No intellisense
}

// AFTER - Full type safety with auto-generated enum
try {
	service.getUser('invalid-id');
} catch (error) {
	if (error instanceof EnhancedAppError) {
		expect(error.errorCode).toBe(ErrorCodes.ERR_USER_NOT_FOUND); // ✅ Enum intellisense
		expect(error.context.userId).toBe('invalid-id'); // ✅ Type-safe
		expect(error.interpolatedMessage).toBe('User with ID "invalid-id" not found');

		// Rich error details for assertions
		const details = error.getErrorDetails();
		expect(details.template).toBe('User with ID "{userId}" not found');
	}
}
```

### IDE Integration

When using the enhanced system:

1. **Autocomplete** - Type `ErrorCodes.ERR_USER_` and see all available user errors
2. **Rich hover tooltips** - Hover over `ErrorCodes.ERR_USER_NOT_FOUND` to see:
   - Exact message template: `"User with ID "{userId}" not found"`
   - Required context: `{ userId: string }`
3. **Parameter hints** - See exactly what context each error needs
4. **Go to definition** - Jump to error schema definitions
5. **Find usages** - Find all places where specific errors are used
6. **Refactor safety** - Rename enum values updates all usages

## File Organization

```
libs/nest/errors/
├── app-error.ts                    # Legacy error class (keep for compatibility)
├── errorcodes.ts                   # Legacy error codes (keep for compatibility)
├── enhanced-error-schemas.ts       # ✨ New: Error schemas with type safety
├── enhanced-app-error.ts           # ✨ New: Enhanced error class
├── enhanced-errors-examples.ts     # ✨ New: Usage examples
├── index.ts                        # Updated exports
└── ENHANCED_ERRORS_MIGRATION.md    # This migration guide
```

## Rollout Plan

### Week 1: Setup

- [ ] Add enhanced error files to the errors library
- [ ] Update exports to include enhanced system
- [ ] Create documentation and examples

### Week 2-3: New Code

- [ ] Use enhanced errors in all new features
- [ ] Train team on enhanced error patterns
- [ ] Update code review guidelines

### Week 4-8: Gradual Migration

- [ ] Migrate user domain errors
- [ ] Migrate vendor domain errors
- [ ] Migrate location domain errors
- [ ] Migrate communication domain errors
- [ ] Migrate infrastructure domain errors

### Week 9-10: Cleanup

- [ ] Update exception filters for enhanced errors
- [ ] Deprecate old error patterns
- [ ] Remove unused legacy error codes

## Compatibility

The enhanced system is fully compatible with existing code:

1. **Legacy errors continue to work** - No breaking changes
2. **Exception filters handle both** - Enhanced and legacy errors
3. **Gradual migration** - Migrate at your own pace
4. **Type safety** - Enhanced errors provide better guarantees

## Team Benefits

1. **Faster development** - Less time looking up error message formats
2. **Fewer bugs** - Type safety prevents context variable mistakes
3. **Better debugging** - Rich error information and message previews
4. **Consistent patterns** - Domain-specific helpers encourage consistency
5. **Self-documenting** - Error schemas serve as documentation

## Summary

The enhanced error handling system provides significant improvements in developer experience while maintaining full backward compatibility. Start using it in new code immediately, then gradually migrate existing error handling for better type safety and intellisense.
