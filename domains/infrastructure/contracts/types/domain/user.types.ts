export interface UserVendorRequest {
	userId: string;
	ne: {
		lat: number;
		lng: number;
	};
	sw: {
		lat: number;
		lng: number;
	};
}
