import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
// Domain types (what we're transforming from)
import type { VendorCreate } from '../../types/domain';

// gRPC types (what we're transforming to) - import from proto when available
// TODO: Replace with actual proto imports when infrastructure service proto is available

// ============================================================================
// OUTBOUND INFRASTRUCTURE ACL PIPES - Transform domain types to infrastructure gRPC
// ============================================================================

/**
 * Vendor Create to Infrastructure Service ACL Pipe
 * Transforms marketplace vendor creation to infrastructure service format
 */
@Injectable()
export class VendorCreateInfrastructureACLPipe
	implements PipeTransform<VendorCreate, InfrastructureVendorCreateRequest>
{
	transform(value: VendorCreate, _metadata: ArgumentMetadata): InfrastructureVendorCreateRequest {
		if (!value.userId) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: 'userId',
				message: 'Required field is missing',
			});
		}

		return {
			name: value.name,
			description: value.description,
			email: value.email,
			phone: value.phone,
			website: value.website,
			ownerId: value.userId,
			metadata: {
				source: 'marketplace',
				createdAt: new Date().toISOString(),
			},
		};
	}
}

/**
 * File Upload to Infrastructure Service ACL Pipe
 * Transforms marketplace file upload to infrastructure service format
 */
@Injectable()
export class FileUploadInfrastructureACLPipe implements PipeTransform<FileUploadData, InfrastructureFileUploadRequest> {
	transform(value: FileUploadData, _metadata: ArgumentMetadata): InfrastructureFileUploadRequest {
		if (!value.userId || !value.fileName) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: !value.userId ? 'userId' : 'fileName',
				message: 'Required field is missing',
			});
		}

		return {
			userId: value.userId,
			fileName: value.fileName,
			fileType: value.fileType,
			fileSize: value.fileSize,
			purpose: value.purpose,
		};
	}
}

/**
 * Auth Request to Infrastructure Service ACL Pipe
 * Transforms marketplace auth requests to infrastructure service format
 */
@Injectable()
export class AuthRequestInfrastructureACLPipe implements PipeTransform<AuthRequestData, InfrastructureAuthRequest> {
	transform(value: AuthRequestData, _metadata: ArgumentMetadata): InfrastructureAuthRequest {
		if (!value.userId || !value.action || !value.resource) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: !value.userId ? 'userId' : !value.action ? 'action' : 'resource',
				message: 'Required field is missing',
			});
		}

		return {
			userId: value.userId,
			action: value.action,
			resource: value.resource,
			context: value.context,
		};
	}
}

/**
 * Event Publish to Infrastructure Service ACL Pipe
 * Transforms marketplace events to infrastructure service format
 */
@Injectable()
export class EventPublishInfrastructureACLPipe implements PipeTransform<EventPublishData, InfrastructureEventRequest> {
	transform(value: EventPublishData, _metadata: ArgumentMetadata): InfrastructureEventRequest {
		if (!value.eventType || !value.data) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: !value.eventType ? 'eventType' : 'data',
				message: 'Required field is missing',
			});
		}

		return {
			eventType: value.eventType,
			data: value.data,
			metadata: {
				source: 'marketplace',
				timestamp: new Date().toISOString(),
				version: '1.0',
				...value.metadata,
			},
		};
	}
}

// ============================================================================
// Types (temporary until proto imports are available)
// ============================================================================

interface FileUploadData {
	userId: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	purpose: 'avatar' | 'vendor_logo' | 'document';
}

interface AuthRequestData {
	userId: string;
	action: string;
	resource: string;
	context?: Record<string, unknown>;
}

interface EventPublishData {
	eventType: string;
	data: unknown;
	metadata?: Record<string, unknown>;
}

interface InfrastructureVendorCreateRequest {
	name: string;
	description?: string;
	email?: string;
	phone?: string;
	website?: string;
	ownerId: string;
	metadata?: Record<string, unknown>;
}

interface InfrastructureFileUploadRequest {
	userId: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	purpose: 'avatar' | 'vendor_logo' | 'document';
}

interface InfrastructureAuthRequest {
	userId: string;
	action: string;
	resource: string;
	context?: Record<string, unknown>;
}

interface InfrastructureEventRequest {
	eventType: string;
	data: unknown;
	metadata?: {
		source: string;
		timestamp: string;
		version: string;
	};
}
