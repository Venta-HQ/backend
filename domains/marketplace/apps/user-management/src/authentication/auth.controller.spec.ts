import { vi } from 'vitest';
import { AuthController } from './auth.controller';

// Mock the proto imports to avoid module resolution issues
vi.mock('@venta/proto/marketplace/user-management', () => ({
	CreateUserResponse: vi.fn(),
	USER_MANAGEMENT_SERVICE_NAME: 'UserManagementService',
	UserIdentityData: vi.fn(),
}));

describe('AuthController', () => {
	let controller: AuthController;
	let mockAuthService: any;

	beforeEach(() => {
		// Create mock AuthService
		mockAuthService = {
			createIntegration: vi.fn(),
			deleteIntegration: vi.fn(),
			handleUserCreated: vi.fn(),
			handleUserDeleted: vi.fn(),
		};

		// Create controller with mocked service
		controller = new AuthController(mockAuthService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('handleUserCreated', () => {
		it('should handle user created successfully', async () => {
			const mockData = { id: 'clerk_user_123' };

			mockAuthService.handleUserCreated.mockResolvedValue({ clerkId: 'clerk_user_123', id: 'db_user_123' });
			mockAuthService.createIntegration.mockResolvedValue(undefined);

			const result = await controller.handleUserCreated(mockData);

			expect(result).toEqual({ message: 'Success' });
			expect(mockAuthService.handleUserCreated).toHaveBeenCalledWith('clerk_user_123');
			expect(mockAuthService.createIntegration).toHaveBeenCalledWith({
				clerkUserId: 'db_user_123',
				providerId: 'clerk_user_123',
			});
		});

		it('should handle service errors', async () => {
			const mockData = { id: 'clerk_user_123' };

			const mockError = new Error('Service error');
			mockAuthService.handleUserCreated.mockRejectedValue(mockError);

			await expect(controller.handleUserCreated(mockData)).rejects.toThrow(mockError);
			expect(mockAuthService.handleUserCreated).toHaveBeenCalledWith('clerk_user_123');
		});
	});

	describe('handleUserDeleted', () => {
		it('should handle user deleted successfully', async () => {
			const mockData = { id: 'clerk_user_123' };

			mockAuthService.handleUserDeleted.mockResolvedValue(undefined);
			mockAuthService.deleteIntegration.mockResolvedValue(undefined);

			const result = await controller.handleUserDeleted(mockData);

			expect(result).toEqual({ message: 'Success' });
			expect(mockAuthService.handleUserDeleted).toHaveBeenCalledWith('clerk_user_123');
			expect(mockAuthService.deleteIntegration).toHaveBeenCalledWith({
				providerId: 'clerk_user_123',
			});
		});

		it('should handle service errors', async () => {
			const mockData = { id: 'clerk_user_123' };

			const mockError = new Error('Service error');
			mockAuthService.handleUserDeleted.mockRejectedValue(mockError);

			await expect(controller.handleUserDeleted(mockData)).rejects.toThrow(mockError);
			expect(mockAuthService.handleUserDeleted).toHaveBeenCalledWith('clerk_user_123');
		});
	});
});
