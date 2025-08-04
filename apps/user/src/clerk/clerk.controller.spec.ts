import { vi } from 'vitest';
import { ClerkController } from './clerk.controller';
import { ClerkService } from './clerk.service';

// Mock the proto imports to avoid module resolution issues
vi.mock('@app/proto/user', () => ({
	ClerkUserData: vi.fn(),
	ClerkUserResponse: vi.fn(),
	USER_SERVICE_NAME: 'UserService',
}));

describe('ClerkController', () => {
	let controller: ClerkController;
	let mockClerkService: any;

	beforeEach(() => {
		// Create mock ClerkService
		mockClerkService = {
			createIntegration: vi.fn(),
			deleteIntegration: vi.fn(),
			handleUserCreated: vi.fn(),
			handleUserDeleted: vi.fn(),
		};

		// Create controller with mocked service
		controller = new ClerkController(mockClerkService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('handleClerkUserCreated', () => {
		it('should handle user created successfully', async () => {
			const mockData = { id: 'clerk_user_123' };

			mockClerkService.handleUserCreated.mockResolvedValue({ clerkId: 'clerk_user_123', id: 'db_user_123' });
			mockClerkService.createIntegration.mockResolvedValue(undefined);

			const result = await controller.handleClerkUserCreated(mockData);

			expect(result).toEqual({ message: 'Success' });
			expect(mockClerkService.handleUserCreated).toHaveBeenCalledWith('clerk_user_123');
			expect(mockClerkService.createIntegration).toHaveBeenCalledWith({
				providerId: 'clerk_user_123',
				userId: 'db_user_123',
			});
		});

		it('should handle service errors', async () => {
			const mockData = { id: 'clerk_user_123' };

			const mockError = new Error('Service error');
			mockClerkService.handleUserCreated.mockRejectedValue(mockError);

			await expect(controller.handleClerkUserCreated(mockData)).rejects.toThrow(mockError);
			expect(mockClerkService.handleUserCreated).toHaveBeenCalledWith('clerk_user_123');
		});
	});

	describe('handleClerkUserDeleted', () => {
		it('should handle user deleted successfully', async () => {
			const mockData = { id: 'clerk_user_123' };

			mockClerkService.handleUserDeleted.mockResolvedValue(undefined);
			mockClerkService.deleteIntegration.mockResolvedValue(undefined);

			const result = await controller.handleClerkUserDeleted(mockData);

			expect(result).toEqual({ message: 'Success' });
			expect(mockClerkService.handleUserDeleted).toHaveBeenCalledWith('clerk_user_123');
			expect(mockClerkService.deleteIntegration).toHaveBeenCalledWith({
				providerId: 'clerk_user_123',
			});
		});

		it('should handle service errors', async () => {
			const mockData = { id: 'clerk_user_123' };

			const mockError = new Error('Service error');
			mockClerkService.handleUserDeleted.mockRejectedValue(mockError);

			await expect(controller.handleClerkUserDeleted(mockData)).rejects.toThrow(mockError);
			expect(mockClerkService.handleUserDeleted).toHaveBeenCalledWith('clerk_user_123');
		});
	});
});
