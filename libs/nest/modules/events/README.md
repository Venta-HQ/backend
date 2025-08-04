# Events Module

## Purpose

The Events module provides event-driven communication capabilities for the Venta backend system. It includes NATS-based event publishing, subscription management, and asynchronous communication between microservices.

## What It Contains

- **Events Service**: Main event service with NATS integration
- **Event Publishing**: Asynchronous event publishing to NATS
- **Event Subscription**: Event listening and processing
- **Event Types**: Type-safe event definitions and interfaces

## Usage

This module is imported by microservices that need to publish or subscribe to events for asynchronous communication.

### For Services
- Import events service for event publishing
- Use event subscription for listening to events
- Apply event types for type-safe event handling
- Configure event routing and processing

### For Event-Driven Architecture
- Import events for service decoupling
- Use events for asynchronous processing
- Apply events for real-time updates
- Configure event persistence and reliability

## Key Benefits

- **Decoupling**: Loose coupling between microservices
- **Scalability**: Asynchronous event processing
- **Reliability**: Event persistence and retry mechanisms
- **Real-time**: Real-time event broadcasting

## Dependencies

- NATS message broker
- NestJS framework
- TypeScript for type definitions 