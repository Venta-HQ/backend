// Type for authenticated request
export interface AuthedRequest extends Request {
	userId: string;
	clerkId: string;
}
