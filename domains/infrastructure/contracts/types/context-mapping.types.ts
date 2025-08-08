import { FileUploadData } from './file/file.types';
import { UserData } from './user/user.types';
import { CreateVendorData, UpdateVendorData } from './vendor/vendor.types';

export namespace Infrastructure {
	export namespace Core {
		export type VendorCreateData = CreateVendorData;
		export type VendorUpdateData = UpdateVendorData;
		export type FileUploadData = FileUploadData;
		export type UserData = UserData;
	}

	export namespace Contracts {
		export interface VendorCreateRequest extends VendorCreateData {
			userId: string;
		}

		export interface VendorUpdateRequest extends VendorUpdateData {
			id: string;
			userId: string;
		}

		export interface FileUploadRequest extends FileUploadData {
			userId: string;
		}

		export interface UserRequest {
			userId: string;
		}
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
