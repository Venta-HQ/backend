# Prisma Schema Organization

This directory contains the Prisma schema files organized by domain for better maintainability and scalability.

## Structure

```
prisma/schema/
├── schema.prisma              # Main schema file with imports
├── domains/
│   ├── user/
│   │   └── user.prisma        # User domain models
│   ├── vendor/
│   │   └── vendor.prisma      # Vendor domain models
│   └── integration/
│       └── integration.prisma # Integration domain models
└── README.md                  # This file
```

## Domain Organization

### User Domain (`domains/marketplace/user/user.prisma`)
- `User` model - Core user entity
- `UserSubscription` model - User subscription management
- `SubscriptionStatus` enum - Subscription status values

### Vendor Domain (`domains/marketplace/vendor/vendor.prisma`)
- `Vendor` model - Vendor business entity
- Location fields for map display
- Business details and metadata

### Integration Domain (`domains/infrastructure/integration/integration.prisma`)
- `Integration` model - External service integrations
- `IntegrationType` enum - Supported integration types

## Usage

The main `schema.prisma` file imports all domain schemas, so you can:

1. **Add new domains**: Create a new directory under `domains/` and add your schema file
2. **Modify existing domains**: Edit the appropriate domain schema file
3. **Import new schemas**: Add the import statement to `schema.prisma`

## Benefits

- **Clear separation of concerns** by domain
- **Easier maintenance** when working on specific domains
- **Better scalability** as the system grows
- **Reduced merge conflicts** when multiple developers work on different domains 