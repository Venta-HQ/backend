# User Service

## Purpose

The User service manages all user-related operations in the Venta backend system. It handles user authentication, profile management, subscription handling, and user-vendor relationships. This service serves as the central authority for user data and authentication state.

## Overview

This microservice provides:
- User account creation and management
- Authentication integration with external providers
- User profile and preferences management
- Subscription and billing integration
- User-vendor relationship management
- User data validation and sanitization

## Key Responsibilities

- **User Management**: Handles user registration, updates, and deletion
- **Authentication**: Integrates with external authentication providers
- **Profile Management**: Manages user profiles, preferences, and settings
- **Subscription Handling**: Processes subscription events and billing
- **Vendor Relationships**: Manages connections between users and vendors
- **Data Validation**: Ensures user data integrity and compliance
- **Event Publishing**: Publishes user-related events for other services

## Architecture

The service follows a domain-driven design approach, focusing specifically on user-related business logic. It exposes gRPC endpoints for other services to consume and publishes events for asynchronous communication with the rest of the system.

## Dependencies

- Database for user data persistence
- External authentication providers
- Subscription management services
- Event system for publishing user events 