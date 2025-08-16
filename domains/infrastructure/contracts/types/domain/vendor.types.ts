export interface VendorCreateRequest {
	name: string;
	description: string;
	email: string;
	phone: string;
	website: string;
	profileImage: string;
}

export interface VendorUpdateRequest {
	id: string;
	name: string;
	description: string;
	email: string;
	phone: string;
	website: string;
	profileImage: string;
}
