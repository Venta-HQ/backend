# Logger Module

## Purpose

The Logger module provides centralized logging functionality for the Venta backend system. It includes structured logging with request context tracking, performance monitoring, and consistent log formatting across all microservices.

## What It Contains

- **Logger Service**: Main logging service with structured output
- **Request Context**: Request ID tracking and context propagation
- **gRPC Logger**: Specialized logging for gRPC services
- **HTTP Logger**: HTTP-specific logging with request/response tracking
- **Performance Logging**: Request timing and performance metrics

## Usage

This module is imported by all microservices and the gateway to provide consistent logging and debugging capabilities.

### For Services
- Import logger service for application logging
- Use request context for request tracking
- Apply transport-specific loggers (gRPC/HTTP)
- Configure logging levels and output formats

### For Gateway
- Import logger for API request logging
- Use request context for user session tracking
- Apply HTTP logger for request/response logging
- Configure logging for different environments

## Key Benefits

- **Observability**: Comprehensive logging for debugging and monitoring
- **Consistency**: Uniform log format across all services
- **Performance**: Request timing and performance tracking
- **Debugging**: Request context for easier troubleshooting

## Dependencies

- NestJS framework
- Pino for structured logging
- Redis for request context storage 