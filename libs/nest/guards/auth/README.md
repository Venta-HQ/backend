# AuthGuard

A NestJS guard that provides authentication using Clerk JWT tokens with Redis caching for performance.

## Features

- **Clerk Integration**: Verifies JWT tokens using Clerk's authentication service
- **Redis Caching**: Caches user lookups to avoid database queries
- **Automatic User Resolution**: Maps Clerk user IDs to internal user IDs
- **Request Enhancement**: Attaches `userId` to the request object for downstream use

## Usage

```typescript
import { AuthGuard } from '@app/nest/guards';

@Controller('protected')
@UseGuards(AuthGuard)
export class ProtectedController {
	@Get()
	getProtectedData(@Req() req: any) {
		// req.userId is automatically set by the guard
		return `Data for user: ${req.userId}`;
	}
}
```

## Dependencies

This guard requires the following services to be available in your module:

- `ClerkService` - For JWT token verification
- `PrismaService` - For user database lookups
- `Redis` - For caching user mappings

## Environment Variables

- `CLERK_SECRET_KEY` - Required for JWT verification

## How It Works

1. **Token Extraction**: Extracts Bearer token from Authorization header
2. **Token Verification**: Uses Clerk to verify the JWT token
3. **User Lookup**: Checks Redis cache for existing user mapping
4. **Database Fallback**: If not cached, queries database for user by Clerk ID
5. **Caching**: Stores the mapping in Redis for 1 hour
6. **Request Enhancement**: Attaches the internal user ID to the request

## Error Handling

- Throws `AppError.authentication(ErrorCodes.UNAUTHORIZED)` for invalid/missing tokens
- Throws `AppError.authentication(ErrorCodes.UNAUTHORIZED)` for non-existent users
- Gracefully handles Redis connection issues

## Testing

See `auth.guard.test.ts` for comprehensive test coverage including:

- Valid token scenarios
- Invalid token scenarios
- Missing token scenarios
- Redis caching behavior
- Database fallback scenarios
