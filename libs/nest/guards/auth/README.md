# Authentication Guard

## Purpose

The Authentication Guard provides user authentication and session validation for the Venta backend system. It validates JWT tokens, checks user sessions, and ensures proper authentication across all protected endpoints.

## What It Contains

- **AuthGuard**: Main authentication guard with JWT validation
- **Session Management**: User session validation and caching
- **Token Verification**: JWT token verification and user lookup

## Usage

This guard is used to protect endpoints that require user authentication.

### Basic Usage
```typescript
// Import the authentication guard
import { AuthGuard } from '@app/nest/guards/auth';

@Controller('users')
export class UserController {
  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Request() req: any) {
    // User is automatically authenticated and available in req.user
    const userId = req.user.id;
    return this.userService.getProfile(userId);
  }
}
```

### Protecting Multiple Endpoints
```typescript
// Protect entire controller
import { AuthGuard } from '@app/nest/guards/auth';

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.userService.getProfile(req.user.id);
  }

  @Put('profile')
  async updateProfile(@Request() req: any, @Body() data: UpdateProfileRequest) {
    return this.userService.updateProfile(req.user.id, data);
  }

  @Delete('account')
  async deleteAccount(@Request() req: any) {
    return this.userService.deleteAccount(req.user.id);
  }
}
```

### Mixed Protection
```typescript
// Some endpoints protected, others public
import { AuthGuard } from '@app/nest/guards/auth';

@Controller('users')
export class UserController {
  // Public endpoint
  @Post('register')
  async register(@Body() data: CreateUserRequest) {
    return this.userService.createUser(data);
  }

  // Protected endpoint
  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Request() req: any) {
    return this.userService.getProfile(req.user.id);
  }

  // Protected endpoint with role check
  @Get('admin')
  @UseGuards(AuthGuard)
  async getAdminData(@Request() req: any) {
    if (!req.user.roles.includes('admin')) {
      throw new AppError('Admin access required', ErrorCodes.FORBIDDEN);
    }
    return this.adminService.getData();
  }
}
```

### Accessing User Information
```typescript
// Access authenticated user data
import { AuthGuard } from '@app/nest/guards/auth';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  @Get()
  async getDashboard(@Request() req: any) {
    const user = req.user;
    
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      permissions: user.permissions
    };
  }

  @Get('personal')
  async getPersonalData(@Request() req: any) {
    const userId = req.user.id;
    return this.userService.getPersonalData(userId);
  }
}
```

### Custom Authentication Logic
```typescript
// Extend auth guard for custom logic
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@app/nest/guards/auth';

@Injectable()
export class CustomAuthGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, perform standard authentication
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    // Add custom logic
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user account is active
    if (!user.isActive) {
      throw new AppError('Account is inactive', ErrorCodes.FORBIDDEN);
    }

    // Check if user has completed profile
    if (!user.profileComplete) {
      throw new AppError('Profile completion required', ErrorCodes.FORBIDDEN);
    }

    return true;
  }
}

// Usage
@Controller('premium')
@UseGuards(CustomAuthGuard)
export class PremiumController {
  @Get('features')
  async getPremiumFeatures(@Request() req: any) {
    return this.premiumService.getFeatures(req.user.id);
  }
}
```

### Global Authentication
```typescript
// Apply authentication globally
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@app/nest/guards/auth';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // Apply to all endpoints
    },
  ],
})
export class AppModule {}
```

### Skip Authentication for Specific Endpoints
```typescript
// Skip authentication for specific endpoints
import { AuthGuard } from '@app/nest/guards/auth';
import { SkipAuth } from '@app/nest/decorators';

@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
  @Get('public')
  @SkipAuth() // Skip authentication for this endpoint
  async getPublicData() {
    return this.service.getPublicData();
  }

  @Get('protected')
  async getProtectedData(@Request() req: any) {
    return this.service.getProtectedData(req.user.id);
  }
}
```

## Key Benefits

- **Security**: Centralized authentication across all endpoints
- **Consistency**: Uniform authentication behavior
- **Session Management**: Reliable user session handling
- **Flexibility**: Configurable authentication logic

## Dependencies

- NestJS framework
- JWT for token handling
- Redis for session storage
- Clerk for authentication service 