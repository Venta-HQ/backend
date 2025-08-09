// No runtime zod usage here; schemas imported from ../schemas
import type { FileUploadData as BaseFileUploadData } from './file/file.types';
import { UserData as BaseUserData, UserVendorRequest as BaseUserVendorRequest } from './user/user.types';
import {
	type CreateVendorData as BaseCreateVendorData,
	type UpdateVendorData as BaseUpdateVendorData,
} from './vendor/vendor.types';

export namespace Infrastructure {
	export namespace Core {
		export type VendorCreateData = BaseCreateVendorData;
		export type VendorUpdateData = BaseUpdateVendorData;
		export type FileUploadData = BaseFileUploadData;
		export type UserData = BaseUserData;
	}

	export namespace Contracts {
		export interface VendorCreateRequest extends Core.VendorCreateData {
			userId: string;
		}

		export interface VendorUpdateRequest extends Core.VendorUpdateData {
			id: string;
			userId: string;
		}

		export interface FileUploadRequest extends Core.FileUploadData {
			userId: string;
		}

		export interface UserRequest {
			userId: string;
		}

		export type UserVendorRequest = BaseUserVendorRequest;
	}

	export namespace Internal {
		export interface FileUploadResult {
			fileId: string;
			url: string;
			uploadedAt: string;
		}

		export interface UserProfile {
			id: string;
			email: string;
			firstName?: string;
			lastName?: string;
			createdAt: string;
			updatedAt: string;
		}
	}
}
