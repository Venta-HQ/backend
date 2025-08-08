import { PrismaService } from '@app/nest/modules';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceToLocationContextMapper } from '../../../../contracts/context-mappers/marketplace-to-location-context-mapper';
import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
	let service: UserManagementService;
	let prisma: PrismaService;
	let locationMapper: MarketplaceToLocationContextMapper;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserManagementService,
				{
					provide: PrismaService,
					useValue: {
						db: {
							user: {
								create: jest.fn(),
								findUnique: jest.fn(),
								update: jest.fn(),
								deleteMany: jest.fn(),
							},
						},
					},
				},
				{
					provide: MarketplaceToLocationContextMapper,
					useValue: {
						toLocationServicesUserUpdate: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<UserManagementService>(UserManagementService);
		prisma = module.get<PrismaService>(PrismaService);
		locationMapper = module.get<MarketplaceToLocationContextMapper>(MarketplaceToLocationContextMapper);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('registerUser', () => {
		it('should register a new user successfully', async () => {
			const mockUser = {
				id: 'test-id',
				clerkId: 'test-clerk-id',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest.spyOn(prisma.db.user, 'create').mockResolvedValue(mockUser);

			const result = await service.registerUser({
				clerkId: 'test-clerk-id',
				source: 'manual',
			});

			expect(result).toEqual(mockUser);
			expect(prisma.db.user.create).toHaveBeenCalledWith({
				data: {
					clerkId: 'test-clerk-id',
				},
			});
		});
	});

	describe('getUserById', () => {
		it('should return user when found', async () => {
			const mockUser = {
				id: 'test-id',
				clerkId: 'test-clerk-id',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			jest.spyOn(prisma.db.user, 'findUnique').mockResolvedValue(mockUser);

			const result = await service.getUserById('test-id');

			expect(result).toEqual(mockUser);
			expect(prisma.db.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'test-id' },
			});
		});

		it('should return null when user not found', async () => {
			jest.spyOn(prisma.db.user, 'findUnique').mockResolvedValue(null);

			const result = await service.getUserById('non-existent-id');

			expect(result).toBeNull();
			expect(prisma.db.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'non-existent-id' },
			});
		});
	});

	describe('updateUserLocation', () => {
		it('should update user location successfully', async () => {
			const mockUser = {
				id: 'test-id',
				clerkId: 'test-clerk-id',
				lat: 40.7128,
				long: -74.006,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockLocationData = {
				coordinates: {
					latitude: 40.7128,
					longitude: -74.006,
				},
			};

			jest.spyOn(locationMapper, 'toLocationServicesUserUpdate').mockReturnValue(mockLocationData);
			jest.spyOn(prisma.db.user, 'update').mockResolvedValue(mockUser);

			const result = await service.updateUserLocation('test-id', {
				lat: 40.7128,
				long: -74.006,
			});

			expect(result).toEqual(mockUser);
			expect(locationMapper.toLocationServicesUserUpdate).toHaveBeenCalledWith('test-id', {
				lat: 40.7128,
				lng: -74.006,
			});
			expect(prisma.db.user.update).toHaveBeenCalledWith({
				data: {
					lat: mockLocationData.coordinates.latitude,
					long: mockLocationData.coordinates.longitude,
				},
				where: {
					id: 'test-id',
				},
			});
		});
	});

	describe('deleteUserProfile', () => {
		it('should delete user profile successfully', async () => {
			jest.spyOn(prisma.db.user, 'deleteMany').mockResolvedValue({ count: 1 });

			await service.deleteUserProfile('test-clerk-id');

			expect(prisma.db.user.deleteMany).toHaveBeenCalledWith({
				where: { clerkId: 'test-clerk-id' },
			});
		});
	});
});
