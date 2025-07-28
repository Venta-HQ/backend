import Redis from 'ioredis';
import { GrpcLocationUpdateSchema, GrpcVendorLocationRequestSchema } from '@app/apitypes/lib/location/location.schemas';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { GrpcSchemaValidatorPipe } from '@app/nest/pipes';
import { LOCATION_SERVICE_NAME, LocationUpdate, VendorLocationRequest } from '@app/proto/location';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';

// Function to calculate distance between two lat/lon points (Haversine formula)
const getDistanceFromLatLon = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
	const R = 6371000; // Radius of the Earth in meters
	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // Distance in meters
};

const calculateBoundingBoxDimensions = async ({
	neLocation,
	swLocation,
}: Omit<VendorLocationRequest, 'callerId'>): Promise<{
	centerLat: number;
	centerLon: number;
	height: number;
	width: number;
}> => {
	if (swLocation && neLocation) {
		// Calculate the width (distance between longitudes) and height (distance between latitudes) in meters
		const width = getDistanceFromLatLon(swLocation.lat, swLocation.long, swLocation.lat, neLocation.long);
		const height = getDistanceFromLatLon(swLocation.lat, swLocation.long, neLocation.lat, swLocation.long);

		// Calculate center of the bounding box (average of swLocation and neLocation points)
		const centerLat = (swLocation.lat + neLocation.lat) / 2;
		const centerLon = (swLocation.long + neLocation.long) / 2;

		return {
			centerLat,
			centerLon,
			height,
			width,
		};
	}

	throw new Error('Unable to get visible bounds');
};

@Controller()
export class LocationController {
	private readonly logger = new Logger(LocationController.name);

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly prisma: PrismaService,
	) {}

	@GrpcMethod(LOCATION_SERVICE_NAME)
	@UsePipes(new GrpcSchemaValidatorPipe(GrpcLocationUpdateSchema))
	async updateVendorLocation(data: LocationUpdate) {
		try {
			await this.redis.geoadd('vendor_locations', data.location.long, data.location.lat, data.entityId);
			await this.prisma.db.vendor.update({
				data: data.location,
				where: {
					id: data.entityId,
				},
			});
		} catch (e) {
			if (e instanceof Prisma.PrismaClientKnownRequestError) {
				if (e.code === 'P2025') {
					throw AppError.notFound(ErrorCodes.VENDOR_NOT_FOUND, { vendorId: data.entityId });
				}
			}
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update vendor location' });
		}
	}

	@GrpcMethod(LOCATION_SERVICE_NAME)
	@UsePipes(new GrpcSchemaValidatorPipe(GrpcVendorLocationRequestSchema))
	async vendorLocations(request: VendorLocationRequest) {
		const { neLocation, swLocation } = request;
		const { centerLat, centerLon, height, width } = await calculateBoundingBoxDimensions({
			neLocation,
			swLocation,
		});

		try {
			const vendorLocations = await this.redis.geosearch(
				'vendor_locations',
				'BYBOX', // Specify the BYBOX method
				width,
				height,
				'm',
				'FROMLONLAT',
				centerLon,
				centerLat,
				'WITHCOORD',
			);
			return {
				vendors: vendorLocations.map((record) => ({
					id: record[0],
					location: {
						lat: record[1][1],
						long: record[1][0],
					},
				})),
			};
		} catch (e) {
			this.logger.error(e);
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'GEO Search' });
		}
	}
}
